import type { SearchResponse } from './types';
import { getWebSearchBetaService } from './webSearchBeta.server';

export class UnifiedWebSearchService {
  private cache = new Map<string, { data: SearchResponse; expires: number }>();
  private cacheTimeout = 30 * 60 * 1000;

  async search(query: string, numResults: number = 5): Promise<SearchResponse> {
    // Check cache first
    const cached = this.cache.get(query);
    if (cached && cached.expires > Date.now()) {
      return cached.data;
    }
    
    try {
      const searchService = await getWebSearchBetaService();
      const results = await searchService.search(query, numResults);
      
      // Cache successful results
      if (results.results.length > 0) {
        this.cache.set(query, {
          data: results,
          expires: Date.now() + this.cacheTimeout
        });
      }
      
      return results;
    } catch (error) {
      // Silent error handling
      
      return {
        query,
        results: [],
        timestamp: new Date().toISOString(),
        source: 'Unified Search',
        error: error instanceof Error ? error.message : 'Search failed'
      };
    }
  }

  /**
   * Format search results for LLM consumption
   */
  formatForLLM(searchResponse: SearchResponse): string {
    const searchService = new (require('./webSearchBeta.server').WebSearchBetaService)();
    return searchService.formatForLLM(searchResponse);
  }
}

// Factory function
export async function getUnifiedWebSearchService(): Promise<UnifiedWebSearchService> {
  return new UnifiedWebSearchService();
}