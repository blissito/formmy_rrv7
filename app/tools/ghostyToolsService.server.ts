import { WebSearchService } from "./webSearch.server";
import { getUnifiedWebSearchService } from "./webSearchUnified.server";
import { getChatbotMetrics, getUserChatbotsMetrics, getChatbotQuickStats, getDateRange } from "server/chatbot/metricsModel.server";
import { getSearchConsoleService } from "~/services/searchConsole.server";
import { db } from "~/utils/db.server";
import { createQuickPaymentLink } from "server/integrations/stripe-payments";

export interface ToolRequest {
  intent: 'search' | 'analyze-url' | 'get-metrics' | 'get-seo-insights' | 'generate-payment-link';
  data: any;
}

export interface SearchRequest {
  query: string;
  maxResults?: number;
}

export interface UrlAnalysisRequest {
  url: string;
  extractContent?: boolean;
  extractMetadata?: boolean;
}

export interface MetricsRequest {
  userId: string;
  chatbotId?: string;
  period?: '7d' | '30d' | '3m' | '1y';
}

export interface SEOInsightsRequest {
  chatbotId: string;
  siteUrl?: string;
  period?: '7d' | '30d' | '3m';
}

export interface PaymentLinkRequest {
  amount: number;
  description: string;
  currency?: string;
  successUrl?: string;
  stripeApiKey: string;
}

export class GhostyToolsService {
  
  async executeIntent(intent: string, data: any): Promise<any> {
    switch (intent) {
      case 'search':
        return await this.handleSearch(data);
      
      case 'analyze-url':
        return await this.handleUrlAnalysis(data);

      case 'get-metrics':
        return await this.handleGetMetrics(data);

      case 'get-seo-insights':
        return await this.handleGetSEOInsights(data);

      case 'generate-payment-link':
        return await this.handleGeneratePaymentLink(data);
      
      default:
        throw new Error(`Unknown intent: ${intent}. Available: search, analyze-url, get-metrics, get-seo-insights, generate-payment-link`);
    }
  }

  private async handleSearch(data: SearchRequest): Promise<any> {
    const { query, maxResults = 5 } = data;

    if (!query?.trim()) {
      throw new Error("Query is required");
    }

    let searchResults;

    try {
      // Use unified search service (Yahoo → Bing strategy, no Google)
      const unifiedService = await getUnifiedWebSearchService();
      searchResults = await unifiedService.search(query, maxResults);
    } catch (error) {
      console.warn("Unified search failed, falling back to basic search:", error);
      // Fallback to basic search service
      const basicSearchService = new WebSearchService();
      searchResults = await basicSearchService.search(query, maxResults);
    }

    return {
      success: true,
      query: searchResults.query,
      results: searchResults.results,
      timestamp: searchResults.timestamp,
      total: searchResults.results.length,
      source: (searchResults as any).source || 'Web'
    };
  }


  private async handleUrlAnalysis(data: UrlAnalysisRequest): Promise<any> {
    const { url, extractContent = true, extractMetadata = true } = data;

    if (!url?.trim()) {
      throw new Error("URL is required");
    }

    // Para análisis de URL individual, podemos reutilizar la lógica de Playwright
    // Por ahora, devolvemos un placeholder
    
    return {
      success: true,
      url,
      metadata: extractMetadata ? {} : undefined,
      content: extractContent ? "" : undefined,
      message: "URL analysis not yet implemented"
    };
  }

  private async handleGetMetrics(data: MetricsRequest): Promise<any> {
    const { userId, chatbotId, period = '30d' } = data;

    if (!userId) {
      throw new Error("userId is required");
    }

    try {
      const dateRange = getDateRange(period);
      
      if (chatbotId) {
        // Métricas de un chatbot específico
        const [metrics, chatbot] = await Promise.all([
          getChatbotMetrics(chatbotId, dateRange.start, dateRange.end),
          db.chatbot.findUnique({
            where: { id: chatbotId },
            select: { name: true, slug: true, userId: true }
          })
        ]);

        if (!chatbot || chatbot.userId !== userId) {
          throw new Error("Chatbot not found or access denied");
        }

        return {
          success: true,
          type: 'single-chatbot',
          chatbot: {
            id: chatbotId,
            name: chatbot.name,
            slug: chatbot.slug
          },
          period: period,
          metrics,
          summary: this.generateMetricsSummary(metrics, chatbot.name)
        };
      } else {
        // Métricas de todos los chatbots del usuario
        const allMetrics = await getUserChatbotsMetrics(userId, dateRange.start, dateRange.end);
        
        return {
          success: true,
          type: 'all-chatbots',
          period: period,
          chatbots: allMetrics,
          summary: this.generateAllChatbotsSummary(allMetrics)
        };
      }
    } catch (error) {
      console.error('Error getting metrics:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error getting metrics'
      };
    }
  }

  private async handleGetSEOInsights(data: SEOInsightsRequest): Promise<any> {
    const { chatbotId, siteUrl, period = '30d' } = data;

    try {
      // Obtener información del chatbot
      const chatbot = await db.chatbot.findUnique({
        where: { id: chatbotId },
        select: { 
          name: true, 
          slug: true, 
          userId: true,
          isActive: true 
        }
      });

      if (!chatbot || !chatbot.isActive) {
        throw new Error("Chatbot not found or inactive");
      }

      // Construir URL si no se proporcionó
      const targetUrl = siteUrl || `https://formmy.app/chat/${chatbot.slug}`;
      
      const searchConsoleService = getSearchConsoleService();
      const seoStats = await searchConsoleService.getQuickSEOStats(targetUrl);

      return {
        success: true,
        chatbot: {
          id: chatbotId,
          name: chatbot.name,
          slug: chatbot.slug
        },
        siteUrl: targetUrl,
        period: period,
        seoMetrics: seoStats,
        summary: this.generateSEOSummary(seoStats, chatbot.name)
      };
    } catch (error) {
      console.error('Error getting SEO insights:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error getting SEO insights'
      };
    }
  }

  private generateMetricsSummary(metrics: any, chatbotName: string): string {
    const { conversations, messages, engagement, performance } = metrics;
    
    let summary = `📊 **Resumen de ${chatbotName}**\n\n`;
    summary += `🤖 **Conversaciones**: ${conversations.total} (${conversations.completed} completadas)\n`;
    summary += `💬 **Mensajes**: ${messages.total} total, ${messages.averagePerConversation} promedio por conversación\n`;
    summary += `👥 **Visitantes únicos**: ${engagement.uniqueVisitors}\n`;
    summary += `⚡ **Tiempo de respuesta**: ${performance.averageResponseTime}ms promedio\n`;
    
    if (engagement.peakHours.length > 0) {
      const topHour = engagement.peakHours[0];
      summary += `📈 **Hora pico**: ${topHour.hour}:00 (${topHour.count} conversaciones)\n`;
    }
    
    return summary;
  }

  private generateAllChatbotsSummary(allMetrics: any[]): string {
    const totalConversations = allMetrics.reduce((sum, m) => sum + m.conversations.total, 0);
    const totalMessages = allMetrics.reduce((sum, m) => sum + m.messages.total, 0);
    const totalVisitors = allMetrics.reduce((sum, m) => sum + m.engagement.uniqueVisitors, 0);
    
    let summary = `📊 **Resumen General**\n\n`;
    summary += `🤖 **${allMetrics.length} chatbots activos**\n`;
    summary += `💬 **${totalConversations} conversaciones totales**\n`;
    summary += `📝 **${totalMessages} mensajes totales**\n`;
    summary += `👥 **${totalVisitors} visitantes únicos**\n\n`;
    
    if (allMetrics.length > 0) {
      const topChatbot = allMetrics.reduce((prev, current) => 
        prev.conversations.total > current.conversations.total ? prev : current
      );
      summary += `🏆 **Mejor chatbot**: ${topChatbot.chatbotName} (${topChatbot.conversations.total} conversaciones)\n`;
    }
    
    return summary;
  }

  private generateSEOSummary(seoStats: any, chatbotName: string): string {
    const { clicks, impressions, ctr, avgPosition } = seoStats;
    
    let summary = `🔍 **SEO Insights - ${chatbotName}**\n\n`;
    
    if (clicks > 0 || impressions > 0) {
      summary += `📊 **Clicks**: ${clicks}\n`;
      summary += `👁️ **Impresiones**: ${impressions}\n`;
      summary += `📈 **CTR**: ${ctr.toFixed(2)}%\n`;
      summary += `📍 **Posición promedio**: ${avgPosition.toFixed(1)}\n\n`;
      
      if (ctr > 5) {
        summary += `💡 **Insight**: ¡Excelente CTR! Tu chatbot atrae bien a los usuarios.\n`;
      } else if (impressions > clicks && ctr < 2) {
        summary += `💡 **Insight**: Muchas impresiones pero bajo CTR. Considera mejorar títulos y descripciones.\n`;
      }
    } else {
      summary += `📝 **Estado**: No se detectaron datos SEO recientes.\n`;
      summary += `💡 **Sugerencia**: Asegúrate de que tu chatbot esté indexado en Google y tenga contenido público.\n`;
    }
    
    return summary;
  }

  private async handleGeneratePaymentLink(data: PaymentLinkRequest): Promise<any> {
    const { amount, description, currency = 'mxn', successUrl, stripeApiKey } = data;

    // Validaciones
    if (!amount || amount <= 0) {
      throw new Error("El monto debe ser mayor a 0");
    }

    if (!description?.trim()) {
      throw new Error("La descripción es requerida");
    }

    if (!stripeApiKey?.trim()) {
      throw new Error("La API key de Stripe es requerida");
    }

    try {
      const paymentUrl = await createQuickPaymentLink(
        stripeApiKey,
        amount,
        description,
        currency
      );

      return {
        success: true,
        paymentUrl,
        details: {
          amount,
          currency: currency.toUpperCase(),
          description,
          formatted_amount: new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: currency.toUpperCase(),
          }).format(amount)
        },
        message: `✅ Link de pago generado exitosamente para ${new Intl.NumberFormat('es-MX', {
          style: 'currency',
          currency: currency.toUpperCase(),
        }).format(amount)}`
      };
    } catch (error) {
      console.error('Error generating payment link:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error generating payment link'
      };
    }
  }

  getAvailableIntents(): string[] {
    return ['search', 'analyze-url', 'get-metrics', 'get-seo-insights', 'generate-payment-link'];
  }
}

// Singleton instance
let ghostyToolsService: GhostyToolsService | null = null;

export function getGhostyToolsService(): GhostyToolsService {
  if (!ghostyToolsService) {
    ghostyToolsService = new GhostyToolsService();
  }
  return ghostyToolsService;
}