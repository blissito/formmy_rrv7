import type { SearchResult, SearchResponse } from './types';

export class DuckDuckGoWebSearchService {
  private cache = new Map<string, { data: SearchResponse; expires: number }>();
  private cacheTimeout = 15 * 60 * 1000;
  private isDebugMode = process.env.NODE_ENV === 'development';

  async search(query: string, numResults: number = 5): Promise<SearchResponse> {
    // Check cache
    const cached = this.cache.get(query);
    if (cached && cached.expires > Date.now()) {
      return cached.data;
    }

    try {
      console.log('🦆 Starting DuckDuckGo search for:', query);

      // DuckDuckGo instant answer API
      const instantUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_redirect=1&skip_disambig=1`;
      
      const instantResponse = await fetch(instantUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; FormMyBot/1.0)'
        }
      });

      if (!instantResponse.ok) {
        throw new Error(`DuckDuckGo API responded with ${instantResponse.status}`);
      }

      const instantData = await instantResponse.json();
      const results: SearchResult[] = [];

      // Process instant answer
      if (instantData.Abstract && instantData.AbstractURL) {
        results.push({
          title: instantData.Heading || query,
          url: instantData.AbstractURL,
          snippet: instantData.Abstract,
          domain: new URL(instantData.AbstractURL).hostname
        });
      }

      // Process related topics
      if (instantData.RelatedTopics && instantData.RelatedTopics.length > 0) {
        for (const topic of instantData.RelatedTopics.slice(0, numResults - results.length)) {
          if (topic.FirstURL && topic.Text) {
            results.push({
              title: topic.Text.split(' - ')[0] || topic.Text.substring(0, 100),
              url: topic.FirstURL,
              snippet: topic.Text,
              domain: new URL(topic.FirstURL).hostname
            });
          }
        }
      }

      // If we don't have enough results, try HTML scraping as fallback
      if (results.length < 2) {
        console.log('🔍 Not enough results from instant API, trying HTML search...');
        const htmlResults = await this.searchHTML(query, numResults);
        results.push(...htmlResults);
      }

      const response: SearchResponse = {
        query,
        results: results.slice(0, numResults),
        timestamp: new Date().toISOString(),
        source: 'duckduckgo'
      };

      // Cache the results
      this.cache.set(query, {
        data: response,
        expires: Date.now() + this.cacheTimeout
      });

      if (this.isDebugMode) {
        console.log(`🦆 DuckDuckGo found ${response.results.length} results`);
      }

      return response;

    } catch (error) {
      console.error('❌ Error in DuckDuckGo search:', error);
      
      // Return empty results instead of throwing
      return {
        query,
        results: [],
        timestamp: new Date().toISOString(),
        source: 'duckduckgo',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async searchHTML(query: string, numResults: number): Promise<SearchResult[]> {
    try {
      const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
      
      const response = await fetch(searchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept-Encoding': 'gzip, deflate',
          'Connection': 'keep-alive'
        }
      });

      if (!response.ok) {
        throw new Error(`DuckDuckGo HTML search failed: ${response.status}`);
      }

      const html = await response.text();
      const results = this.parseHTMLResults(html, numResults);
      
      return results;
    } catch (error) {
      console.warn('⚠️ HTML search fallback failed:', error);
      return [];
    }
  }

  private parseHTMLResults(html: string, numResults: number): SearchResult[] {
    const results: SearchResult[] = [];
    
    try {
      // Simple regex-based parsing for DuckDuckGo HTML results
      const resultRegex = /<div class="result"[\s\S]*?<a[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>[\s\S]*?<span class="result__snippet"[^>]*>([\s\S]*?)<\/span>/gi;
      
      let match;
      while ((match = resultRegex.exec(html)) && results.length < numResults) {
        const url = match[1];
        const title = match[2].replace(/<[^>]*>/g, '').trim();
        const snippet = match[3].replace(/<[^>]*>/g, '').trim();
        
        if (url && title && snippet && url.startsWith('http')) {
          try {
            const domain = new URL(url).hostname;
            results.push({
              title: title.substring(0, 150),
              url,
              snippet: snippet.substring(0, 200),
              domain
            });
          } catch (urlError) {
            // Skip invalid URLs
            continue;
          }
        }
      }
    } catch (parseError) {
      console.warn('⚠️ Failed to parse DuckDuckGo HTML:', parseError);
    }
    
    return results;
  }
}

// Factory function
export async function getDuckDuckGoWebSearchService(): Promise<DuckDuckGoWebSearchService> {
  const service = new DuckDuckGoWebSearchService();
  console.log('🦆 DuckDuckGo web search service initialized');
  return service;
}