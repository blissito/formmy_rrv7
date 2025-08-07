import type { SearchResult, SearchResponse } from './types';

export class GoogleCustomSearchService {
  private cache = new Map<string, { data: SearchResponse; expires: number }>();
  private cacheTimeout = 30 * 60 * 1000; // 30 minutos
  private isDebugMode = process.env.NODE_ENV === 'development';
  private apiKey: string;
  private searchEngineId: string;

  constructor() {
    this.apiKey = process.env.GOOGLE_SEARCH_API_KEY || '';
    this.searchEngineId = process.env.GOOGLE_SEARCH_ENGINE_ID || '';
    
    if (!this.apiKey) {
      throw new Error('GOOGLE_SEARCH_API_KEY environment variable is required');
    }
    
    if (!this.searchEngineId) {
      throw new Error('GOOGLE_SEARCH_ENGINE_ID environment variable is required');
    }
  }

  async search(query: string, numResults: number = 5): Promise<SearchResponse> {
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
        num: Math.min(numResults, 10).toString(), // Google allows max 10 per request
        start: '1',
        lr: 'lang_es|lang_en', // Spanish and English results
        safe: 'active',
        gl: 'es' // Geolocation: Spain
      });

      const response = await fetch(`${searchUrl}?${params}`, {
        method: 'GET',
        headers: {
          'User-Agent': 'FormMyBot/1.0',
          'Accept': 'application/json',
          'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8'
        },
        signal: AbortSignal.timeout(10000)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Google API error ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      
      // Parse results
      const results: SearchResult[] = [];
      
      if (data.items && data.items.length > 0) {
        for (const item of data.items.slice(0, numResults)) {
          try {
            const domain = new URL(item.link).hostname;
            
            // Use snippet or meta description
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
            if (this.isDebugMode) {
              console.warn('⚠️ Invalid URL in Google result:', item.link);
            }
            continue;
          }
        }
      }

      const searchResponse: SearchResponse = {
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
      // Silent error logging for debugging
      
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

  // Test API connectivity and quota
  async testConnection(): Promise<{ success: boolean; quota?: any; error?: string }> {
    try {
      const testUrl = `https://www.googleapis.com/customsearch/v1?key=${this.apiKey}&cx=${this.searchEngineId}&q=test&num=1`;
      
      const response = await fetch(testUrl, {
        signal: AbortSignal.timeout(5000)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        return {
          success: false,
          error: errorData?.error?.message || `HTTP ${response.status}`
        };
      }

      const data = await response.json();
      
      return {
        success: true,
        quota: {
          totalResults: data.searchInformation?.totalResults,
          searchTime: data.searchInformation?.searchTime,
          hasResults: data.items?.length > 0
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Connection test failed'
      };
    }
  }

  // Format search results for LLM consumption
  formatForLLM(searchResponse: SearchResponse): string {
    if (searchResponse.results.length === 0) {
      return `No se encontraron resultados en Google para: "${searchResponse.query}"`;
    }

    let formatted = `Resultados de Google Search para: "${searchResponse.query}"\\n`;
    
    if (searchResponse.totalResults) {
      formatted += `Total de resultados encontrados: ${searchResponse.totalResults}\\n\\n`;
    }
    
    searchResponse.results.forEach((result, index) => {
      formatted += `${index + 1}. **${result.title}**\\n`;
      formatted += `   URL: ${result.url}\\n`;
      formatted += `   ${result.snippet}\\n\\n`;
    });
    
    return formatted;
  }
}

// Factory function
export async function getGoogleCustomSearchService(): Promise<GoogleCustomSearchService> {
  return new GoogleCustomSearchService();
}