import { tool } from "ai";
import z from "zod";

/**
 * Google Custom Search Service
 * Reutilizado del handler con caché de 30min
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
}

// Singleton instance
const searchService = new GoogleCustomSearchService();

/**
 * Vercel AI SDK Tool: Web search
 * Búsqueda web con Google Custom Search API y caché de 30min
 */
export const createWebSearchTool = () => tool({
  description: "Search the web using Google Custom Search API with 30min cache. Returns relevant results in Spanish and English.",
  inputSchema: z.object({
    query: z.string().describe("Search query in Spanish or English"),
    numResults: z.number().optional().describe("Number of results (1-10, default 5)")
  }),
  execute: async ({ query, numResults = 5 }) => {
    // Validar query
    if (!query || query.trim().length === 0) {
      return "❌ Error: La búsqueda requiere una consulta válida";
    }

    // Validar numResults
    const validNumResults = Math.min(Math.max(numResults, 1), 10);

    // Ejecutar búsqueda
    const searchResponse = await searchService.search(query, validNumResults);

    // Si hay error
    if (searchResponse.error) {
      return `❌ Error al ejecutar la búsqueda: ${searchResponse.error}`;
    }

    // Si no hay resultados
    if (!searchResponse.results || searchResponse.results.length === 0) {
      return `No se encontraron resultados para: "${query}"`;
    }

    // Formatear resultados
    let formatted = `🔍 **Resultados de búsqueda para:** "${query}"\n\n`;

    if (searchResponse.totalResults) {
      formatted += `📊 Total de resultados: ${searchResponse.totalResults}\n\n`;
    }

    searchResponse.results.forEach((result: any, index: number) => {
      formatted += `**[${index + 1}] ${result.title}**\n`;
      formatted += `🔗 ${result.url}\n`;
      formatted += `📝 ${result.snippet}\n\n`;
    });

    return formatted;
  }
});
