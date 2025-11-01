import type { SearchResult, SearchResponse } from './types';
import { getGoogleCustomSearchService } from './webSearchGoogle.server';

export class WebSearchBetaService {
  private cache = new Map<string, { data: SearchResponse; expires: number }>();
  private cacheTimeout = 30 * 60 * 1000; // 30 minutos
  private isDebugMode = process.env.NODE_ENV === 'development';

  async search(query: string, numResults: number = 5): Promise<SearchResponse> {
    // Check cache first
    const cached = this.cache.get(query);
    if (cached && cached.expires > Date.now()) {
      if (this.isDebugMode) {
      }
      return cached.data;
    }


    // Step 1: Try Google Custom Search (if available)
    if (process.env.GOOGLE_SEARCH_API_KEY && process.env.GOOGLE_SEARCH_ENGINE_ID) {
      try {
        const googleResults = await this.searchGoogle(query, numResults);
        
        if (googleResults.results.length > 0) {
          
          // Cache and return
          this.cache.set(query, {
            data: googleResults,
            expires: Date.now() + this.cacheTimeout
          });
          
          return googleResults;
        } else {
        }
      } catch (googleError) {
      }
    } else {
    }

    // Step 2: Try DuckDuckGo
    try {
      const duckResults = await this.searchDuckDuckGo(query, numResults);
      
      if (duckResults.results.length > 0) {
        
        // Cache and return
        this.cache.set(query, {
          data: duckResults,
          expires: Date.now() + this.cacheTimeout
        });
        
        return duckResults;
      } else {
      }
    } catch (duckError) {
    }

    // Step 2: Try Wikipedia as fallback
    try {
      const wikiResults = await this.searchWikipedia(query, Math.min(numResults, 3));
      
      if (wikiResults.results.length > 0) {
        // Cache and return
        this.cache.set(query, {
          data: wikiResults,
          expires: Date.now() + this.cacheTimeout
        });
        
        return wikiResults;
      }
    } catch (wikiError) {
      // Silent failure
    }

    // All failed
    return {
      query,
      results: [],
      timestamp: new Date().toISOString(),
      source: 'Web Search Beta',
      error: 'No results found from any search provider'
    };
  }

  private async searchGoogle(query: string, numResults: number): Promise<SearchResponse> {
    const googleService = await getGoogleCustomSearchService();
    return await googleService.search(query, numResults);
  }

  private async searchDuckDuckGo(query: string, numResults: number): Promise<SearchResponse> {
    try {
      // DuckDuckGo instant answer API
      const instantUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_redirect=1&skip_disambig=1`;
      
      const response = await fetch(instantUrl, {
        headers: {
          'User-Agent': 'FormMyBot/1.0 (Web Search Beta)'
        },
        signal: AbortSignal.timeout(10000)
      });

      if (!response.ok) {
        throw new Error(`DuckDuckGo API error: ${response.status}`);
      }

      const data = await response.json();
      const results: SearchResult[] = [];

      // Process instant answer
      if (data.Abstract && data.AbstractURL) {
        results.push({
          title: data.Heading || query,
          url: data.AbstractURL,
          snippet: data.Abstract,
          domain: new URL(data.AbstractURL).hostname
        });
      }

      // Process related topics
      if (data.RelatedTopics && data.RelatedTopics.length > 0) {
        for (const topic of data.RelatedTopics.slice(0, numResults - results.length)) {
          if (topic.FirstURL && topic.Text) {
            try {
              results.push({
                title: topic.Text.split(' - ')[0] || topic.Text.substring(0, 100),
                url: topic.FirstURL,
                snippet: topic.Text,
                domain: new URL(topic.FirstURL).hostname
              });
            } catch (urlError) {
              continue;
            }
          }
        }
      }

      return {
        query,
        results: results.slice(0, numResults),
        timestamp: new Date().toISOString(),
        source: 'DuckDuckGo'
      };

    } catch (error) {
      throw new Error(`DuckDuckGo search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async searchWikipedia(query: string, numResults: number): Promise<SearchResponse> {
    try {
      // Wikipedia search API
      const searchUrl = `https://es.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`;
      
      let response = await fetch(searchUrl, {
        headers: {
          'User-Agent': 'FormMyBot/1.0 (Web Search Beta)',
          'Accept': 'application/json'
        },
        signal: AbortSignal.timeout(10000)
      });

      const results: SearchResult[] = [];

      // Try direct page first
      if (response.ok) {
        const data = await response.json();
        if (data.extract) {
          results.push({
            title: data.title,
            url: data.content_urls?.desktop?.page || `https://es.wikipedia.org/wiki/${encodeURIComponent(query)}`,
            snippet: data.extract,
            domain: 'es.wikipedia.org'
          });
        }
      }

      // If we need more results or direct search failed, try search API
      if (results.length < numResults) {
        const searchApiUrl = `https://es.wikipedia.org/w/api.php?action=query&format=json&list=search&srsearch=${encodeURIComponent(query)}&srlimit=${numResults}&srprop=snippet&origin=*`;
        
        response = await fetch(searchApiUrl, {
          headers: {
            'User-Agent': 'FormMyBot/1.0 (Web Search Beta)'
          },
          signal: AbortSignal.timeout(10000)
        });

        if (response.ok) {
          const searchData = await response.json();
          
          if (searchData.query?.search) {
            for (const item of searchData.query.search) {
              if (results.length >= numResults) break;
              
              // Skip if we already have this result
              const alreadyExists = results.some(r => r.title.toLowerCase() === item.title.toLowerCase());
              if (alreadyExists) continue;
              
              results.push({
                title: item.title,
                url: `https://es.wikipedia.org/wiki/${encodeURIComponent(item.title)}`,
                snippet: this.cleanWikipediaSnippet(item.snippet || ''),
                domain: 'es.wikipedia.org'
              });
            }
          }
        }
      }

      return {
        query,
        results: results.slice(0, numResults),
        timestamp: new Date().toISOString(),
        source: 'Wikipedia'
      };

    } catch (error) {
      throw new Error(`Wikipedia search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private cleanWikipediaSnippet(snippet: string): string {
    return snippet
      .replace(/<span[^>]*class="searchmatch"[^>]*>/g, '') // Remove highlight spans
      .replace(/<\/span>/g, '')
      .replace(/<[^>]*>/g, '') // Remove any remaining HTML
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 200);
  }

  // Format search results for LLM consumption
  formatForLLM(searchResponse: SearchResponse): string {
    if (searchResponse.results.length === 0) {
      return `No se encontraron resultados para: "${searchResponse.query}"`;
    }

    const sourceLabel = searchResponse.source || 'Web';
    let formatted = `Resultados de búsqueda web (${sourceLabel}) para: "${searchResponse.query}"\\n\\n`;
    
    searchResponse.results.forEach((result, index) => {
      formatted += `${index + 1}. **${result.title}**\\n`;
      formatted += `   URL: ${result.url}\\n`;
      formatted += `   ${result.snippet}\\n\\n`;
    });
    
    return formatted;
  }
}

// Factory function
export async function getWebSearchBetaService(): Promise<WebSearchBetaService> {
  return new WebSearchBetaService();
}