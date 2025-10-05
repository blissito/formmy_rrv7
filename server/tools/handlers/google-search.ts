import type { ToolContext, ToolResponse } from "../types";
import { ToolUsageTracker } from "../../integrations/tool-usage-tracker";

/**
 * Google Custom Search Service
 * Reutilizando implementación probada con caché de 30min
 */
class GoogleCustomSearchService {
  private cache = new Map<string, { data: any; expires: number }>();
  private cacheTimeout = 30 * 60 * 1000; // 30 minutos
  private apiKey: string;
  private searchEngineId: string;

  constructor() {
    this.apiKey = process.env.GOOGLE_SEARCH_API_KEY || '';
    this.searchEngineId = process.env.GOOGLE_SEARCH_ENGINE_ID || '';

    if (!this.apiKey || !this.searchEngineId) {
      throw new Error('Google Search API credentials not configured');
    }
  }

  async search(query: string, numResults: number = 5): Promise<any> {
    // Check cache
    const cached = this.cache.get(query);
    if (cached && cached.expires > Date.now()) {
      return cached.data;
    }

    try {
      const searchUrl = 'https://www.googleapis.com/customsearch/v1';
      const params = new URLSearchParams({
        key: this.apiKey,
        cx: this.searchEngineId,
        q: query,
        num: Math.min(numResults, 10).toString(),
        start: '1',
        lr: 'lang_es|lang_en',
        safe: 'active',
        gl: 'mx' // Geolocation: Mexico
      });

      const response = await fetch(`${searchUrl}?${params}`, {
        method: 'GET',
        headers: {
          'User-Agent': 'FormMyBot/1.0',
          'Accept': 'application/json',
          'Accept-Language': 'es-MX,es;q=0.9,en;q=0.8'
        },
        signal: AbortSignal.timeout(10000)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Google API error ${response.status}: ${errorText}`);
      }

      const data = await response.json();

      // Parse results
      const results = [];

      if (data.items && data.items.length > 0) {
        for (const item of data.items.slice(0, numResults)) {
          try {
            const domain = new URL(item.link).hostname;
            const snippet = item.snippet ||
                           (item.pagemap?.metatags?.[0]?.['og:description']) ||
                           (item.pagemap?.metatags?.[0]?.description) ||
                           '';

            results.push({
              title: this.cleanText(item.title || ''),
              url: item.link,
              snippet: this.cleanText(snippet),
              domain: domain
            });
          } catch (urlError) {
            continue;
          }
        }
      }

      const searchResponse = {
        query,
        results,
        timestamp: new Date().toISOString(),
        source: 'Google',
        totalResults: data.searchInformation?.totalResults || '0'
      };

      // Cache the results
      this.cache.set(query, {
        data: searchResponse,
        expires: Date.now() + this.cacheTimeout
      });

      return searchResponse;

    } catch (error) {
      return {
        query,
        results: [],
        timestamp: new Date().toISOString(),
        source: 'Google',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private cleanText(text: string): string {
    return text
      .replace(/\s+/g, ' ')
      .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
      .trim()
      .substring(0, 300);
  }

  formatForLLM(searchResponse: any): string {
    if (searchResponse.results.length === 0) {
      return `No se encontraron resultados en Google para: "${searchResponse.query}"`;
    }

    let formatted = `🔍 **Resultados de búsqueda en Google para:** "${searchResponse.query}"\n\n`;

    if (searchResponse.totalResults) {
      formatted += `📊 Total de resultados: ${searchResponse.totalResults}\n\n`;
    }

    searchResponse.results.forEach((result: any, index: number) => {
      formatted += `**[${index + 1}] ${result.title}**\n`;
      formatted += `🔗 ${result.url}\n`;
      formatted += `📝 ${result.snippet}\n\n`;
    });

    formatted += `\n💡 Puedes usar [1], [2], [3], etc. para citar las fuentes.`;

    return formatted;
  }
}

/**
 * Rate limiting por plan y conversación
 * Lógica: Más pagas → más valor
 * Costos: Google Search API = $5 USD por 1,000 queries
 *
 * ANONYMOUS: Visitantes de chatbots públicos (mínimo para demo sin abuso)
 * FREE: Sin acceso post-trial (incentiva upgrade)
 * STARTER: $149/mes → valor tangible, cumple promesa del plan
 * PRO: $499/mes → 2.5x más búsquedas que STARTER
 * ENTERPRISE: $2,499/mes → casi ilimitado para uso profesional
 */
const SEARCH_LIMITS = {
  ANONYMOUS: 2,      // Suficiente para demo, previene abuso | Costo: $0.01 USD
  FREE: 0,           // Sin acceso, incentiva compra | Costo: $0
  STARTER: 10,       // Valor real por $149/mes | Costo: $0.05 USD
  PRO: 25,           // 2.5x STARTER, justifica $499/mes | Costo: $0.125 USD
  ENTERPRISE: 100,   // Prácticamente ilimitado | Costo: $0.50 USD
  TRIAL: 10          // Mismas que STARTER para evaluar | Costo: $0.05 USD
} as const;

async function checkRateLimit(context: ToolContext): Promise<{ allowed: boolean; remaining: number; limit: number }> {
  const limit = SEARCH_LIMITS[context.userPlan as keyof typeof SEARCH_LIMITS] || 0;

  if (limit === 0) {
    return { allowed: false, remaining: 0, limit: 0 };
  }

  // Si no hay conversationId, permitir (fallback)
  if (!context.conversationId) {
    return { allowed: true, remaining: limit, limit };
  }

  try {
    const { db } = await import("~/utils/db.server");

    // Contar búsquedas en las últimas 24 horas para esta conversación
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const searchCount = await db.toolUsage.count({
      where: {
        conversationId: context.conversationId,
        toolName: 'web_search_google',
        createdAt: { gte: startOfDay }
      }
    });

    const remaining = Math.max(0, limit - searchCount);
    return {
      allowed: searchCount < limit,
      remaining,
      limit
    };
  } catch (error) {
    // En caso de error de BD, permitir (fail-open para no bloquear experiencia)
    return { allowed: true, remaining: limit, limit };
  }
}

/**
 * Handler para búsqueda web con Google Custom Search API
 * Siguiendo patrón oficial LlamaIndex Agent Workflows
 * 🛡️ Con rate limiting por conversación y plan
 */
export async function googleSearchHandler(
  input: {
    query: string;
    numResults?: number;
  },
  context: ToolContext
): Promise<ToolResponse> {
  const { query, numResults = 5 } = input;

  // Validar que la query no esté vacía
  if (!query || query.trim().length === 0) {
    return {
      success: false,
      message: "❌ Error: La búsqueda requiere una consulta válida"
    };
  }

  // 🛡️ RATE LIMITING - Verificar límites diarios
  const rateLimit = await checkRateLimit(context);
  if (!rateLimit.allowed) {
    const upgradeMessage = context.userPlan === 'FREE' || context.userPlan === 'ANONYMOUS'
      ? "\n\n💡 Actualiza a plan STARTER ($149/mes) para obtener 10 búsquedas diarias."
      : "\n\n💡 Actualiza tu plan para más búsquedas diarias.";

    return {
      success: false,
      message: `⚠️ Has alcanzado el límite de búsquedas web para hoy (${rateLimit.limit} búsquedas/día).${upgradeMessage}`
    };
  }

  // Validar que numResults sea razonable
  const validNumResults = Math.min(Math.max(numResults, 1), 10);

  try {
    // Verificar variables de entorno
    if (!process.env.GOOGLE_SEARCH_API_KEY || !process.env.GOOGLE_SEARCH_ENGINE_ID) {
      return {
        success: false,
        message: "⚠️ Google Search no está configurado correctamente en este chatbot."
      };
    }

    // Ejecutar búsqueda
    const searchService = new GoogleCustomSearchService();
    const searchResponse = await searchService.search(query, validNumResults);

    // Track usage (sin awaitar para no bloquear respuesta)
    if (context.conversationId) {
      ToolUsageTracker.trackUsage({
        chatbotId: context.chatbotId || 'unknown',
        conversationId: context.conversationId,
        toolName: 'web_search_google',
        success: true,
        userMessage: context.message,
        metadata: {
          query,
          numResults: validNumResults,
          resultsFound: searchResponse.results.length,
          totalResults: searchResponse.totalResults,
          remainingSearches: rateLimit.remaining - 1
        }
      }).catch(() => {}); // Silent fail
    }

    // Formatear resultados para el LLM
    const formattedResults = searchService.formatForLLM(searchResponse);

    // Agregar info de búsquedas restantes
    const remainingInfo = rateLimit.remaining > 1
      ? `\n\n📊 Búsquedas restantes hoy: ${rateLimit.remaining - 1}/${rateLimit.limit}`
      : `\n\n⚠️ Última búsqueda del día (${rateLimit.limit} máximo)`;

    return {
      success: true,
      message: formattedResults + remainingInfo,
      data: {
        query,
        results: searchResponse.results,
        totalResults: searchResponse.totalResults,
        timestamp: searchResponse.timestamp,
        toolUsed: 'web_search_google',
        rateLimitInfo: {
          remaining: rateLimit.remaining - 1,
          limit: rateLimit.limit
        }
      }
    };

  } catch (error) {
    // Track error (sin awaitar)
    if (context.conversationId) {
      ToolUsageTracker.trackUsage({
        chatbotId: context.chatbotId || 'unknown',
        conversationId: context.conversationId,
        toolName: 'web_search_google',
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        userMessage: context.message,
        metadata: { query, numResults: validNumResults }
      }).catch(() => {}); // Silent fail
    }

    return {
      success: false,
      message: `❌ Error al ejecutar la búsqueda: ${error instanceof Error ? error.message : 'Error desconocido'}`
    };
  }
}
