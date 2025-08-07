import { WebSearchService } from "./webSearch.server";
import { getUnifiedWebSearchService } from "./webSearchUnified.server";

export interface ToolRequest {
  intent: 'search' | 'analyze-url';
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

export class GhostyToolsService {
  
  async executeIntent(intent: string, data: any): Promise<any> {
    switch (intent) {
      case 'search':
        return await this.handleSearch(data);
      
      case 'analyze-url':
        return await this.handleUrlAnalysis(data);
      
      default:
        throw new Error(`Unknown intent: ${intent}. Available: search, analyze-url`);
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

  getAvailableIntents(): string[] {
    return ['search', 'extract-images', 'analyze-url'];
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