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
 * Handler para búsqueda web con Google Custom Search API
 * Siguiendo patrón oficial LlamaIndex Agent Workflows
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
    if (context.chatbotId) {
      ToolUsageTracker.trackUsage({
        chatbotId: context.chatbotId,
        toolName: 'web_search_google',
        success: true,
        userMessage: context.message,
        metadata: {
          query,
          numResults: validNumResults,
          resultsFound: searchResponse.results.length,
          totalResults: searchResponse.totalResults
        }
      }).catch(console.error);
    }

    // Formatear resultados para el LLM
    const formattedResults = searchService.formatForLLM(searchResponse);

    return {
      success: true,
      message: formattedResults,
      data: {
        query,
        results: searchResponse.results,
        totalResults: searchResponse.totalResults,
        timestamp: searchResponse.timestamp,
        toolUsed: 'web_search_google'
      }
    };

  } catch (error) {
    console.error("Error ejecutando búsqueda en Google:", error);

    // Track error (sin awaitar)
    if (context.chatbotId) {
      ToolUsageTracker.trackUsage({
        chatbotId: context.chatbotId,
        toolName: 'web_search_google',
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        userMessage: context.message,
        metadata: { query, numResults: validNumResults }
      }).catch(console.error);
    }

    return {
      success: false,
      message: `❌ Error al ejecutar la búsqueda: ${error instanceof Error ? error.message : 'Error desconocido'}`
    };
  }
}
