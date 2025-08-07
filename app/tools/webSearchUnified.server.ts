import type { SearchResult, SearchResponse } from './types';
import { getYahooWebSearchService } from './webSearchYahoo.server';
import { getBingWebSearchService } from './webSearchBing.server';

export class UnifiedWebSearchService {
  private cache = new Map<string, { data: SearchResponse; expires: number }>();
  private cacheTimeout = 15 * 60 * 1000;
  private isDebugMode = process.env.NODE_ENV === 'development';

  async search(query: string, numResults: number = 5): Promise<SearchResponse> {
    // Check cache first
    const cached = this.cache.get(query);
    if (cached && cached.expires > Date.now()) {
      console.log('✅ Cache hit for query:', query);
      return cached.data;
    }

    console.log('🎯 Starting unified search strategy for:', query);
    console.log('📋 Strategy: Bing → Yahoo (no Google)');

    // Step 1: Try Bing first (primary engine - works better!)
    let results: SearchResponse | null = null;
    
    try {
      console.log('🔵 Attempt 1: Bing Search...');
      const bingService = await getBingWebSearchService();
      results = await bingService.search(query, numResults);
      
      // Debug Bing results
      console.log('🔍 Bing results debug:', {
        hasResults: !!results,
        resultsCount: results?.results?.length || 0,
        resultsStructure: results ? Object.keys(results) : 'null',
        firstResult: results?.results?.[0] ? {
          title: results.results[0].title,
          url: results.results[0].url
        } : 'none'
      });

      // Bing search successful if we have results
      if (results && results.results && results.results.length > 0) {
        console.log(`✅ Bing search successful: ${results.results.length} results`);
        
        // Cache and return Bing results
        this.cache.set(query, {
          data: { ...results, source: 'Bing' } as any,
          expires: Date.now() + this.cacheTimeout
        });
        
        return { ...results, source: 'Bing' } as any;
      } else {
        console.log('⚠️ Bing search returned 0 results, trying Yahoo...');
      }
    } catch (bingError) {
      console.log('❌ Bing search failed:', bingError instanceof Error ? bingError.message : bingError);
      console.log('🔄 Falling back to Yahoo...');
    }

    // Step 2: Try Yahoo as fallback
    try {
      console.log('🟡 Attempt 2: Yahoo Search...');
      const yahooService = await getYahooWebSearchService();
      results = await yahooService.search(query, numResults);
      
      // Yahoo search successful if we have results  
      if (results && results.results.length > 0) {
        console.log(`✅ Yahoo search successful: ${results.results.length} results`);
        
        // Cache and return Yahoo results
        this.cache.set(query, {
          data: { ...results, source: 'Yahoo' } as any,
          expires: Date.now() + this.cacheTimeout
        });
        
        return { ...results, source: 'Yahoo' } as any;
      } else {
        console.log('⚠️ Yahoo search returned 0 results');
      }
    } catch (yahooError) {
      console.log('❌ Yahoo search failed:', yahooError instanceof Error ? yahooError.message : yahooError);
    }

    // Step 3: All search engines failed
    console.log('❌ All search engines failed');
    const emptyResponse: SearchResponse = {
      query,
      results: [],
      timestamp: new Date()
    };

    return emptyResponse;
  }

  /**
   * Format search results for LLM consumption
   */
  formatForLLM(searchResponse: SearchResponse): string {
    const sourceLabel = (searchResponse as any).source || 'Web';
    
    if (searchResponse.results.length === 0) {
      return `🔍 BÚSQUEDA WEB: "${searchResponse.query}"
⏰ ${new Date().toLocaleString('es-MX')}
❌ No se encontraron resultados

💡 Intenta reformular la consulta o buscar términos más específicos.`;
    }

    const sources = searchResponse.results
      .map((result, index) => {
        const content = result.content 
          ? `\n   📄 Contenido: "${result.content}"`
          : '';
        
        return `[${index + 1}] ${result.title}
   🔗 ${result.url}
   📝 ${result.snippet}${content}`;
      })
      .join('\n\n');

    return `🔍 BÚSQUEDA WEB: "${searchResponse.query}"
⏰ ${new Date().toLocaleString('es-MX')}
🌐 Motor: ${sourceLabel}

📚 FUENTES ENCONTRADAS:
${sources}

💡 Usa [1], [2], [3] etc. para citar las fuentes cuando respondas.`;
  }

  /**
   * Format references for markdown display
   */
  formatReferences(searchResponse: SearchResponse): string {
    if (searchResponse.results.length === 0) {
      return '';
    }

    const sourceLabel = (searchResponse as any).source || 'Web';
    
    return `\n\n**📚 Fuentes consultadas (${sourceLabel}):**\n` + 
      searchResponse.results
        .map((result, index) => 
          `[${index + 1}] [${result.title}](${result.url})`
        )
        .join('\n');
  }

  /**
   * Clean up resources
   */
  async close() {
    console.log('✅ Unified web search service closed');
  }
}

// Singleton instance
let serviceInstance: UnifiedWebSearchService | null = null;

export async function getUnifiedWebSearchService(): Promise<UnifiedWebSearchService> {
  if (!serviceInstance) {
    serviceInstance = new UnifiedWebSearchService();
    console.log("✅ Unified web search service initialized (Yahoo → Bing strategy)");
  }
  return serviceInstance;
}

export async function cleanupUnifiedWebSearchService() {
  if (serviceInstance) {
    await serviceInstance.close();
    serviceInstance = null;
  }
}