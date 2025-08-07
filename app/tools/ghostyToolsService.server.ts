import { getImageExtractor } from "./imageExtractor.server";
import { WebSearchService } from "./webSearch.server";
import { getWebSearchService } from "./webSearchPlaywright.server";

export interface ToolRequest {
  intent: 'search' | 'extract-images' | 'analyze-url';
  data: any;
}

export interface SearchRequest {
  query: string;
  maxResults?: number;
  enablePlaywright?: boolean;
}

export interface ImageExtractionRequest {
  urls: string[];
  maxImagesPerUrl?: number;
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
      
      case 'extract-images':
        return await this.handleImageExtraction(data);
      
      case 'analyze-url':
        return await this.handleUrlAnalysis(data);
      
      default:
        throw new Error(`Unknown intent: ${intent}. Available: search, extract-images, analyze-url`);
    }
  }

  private async handleSearch(data: SearchRequest): Promise<any> {
    const { query, maxResults = 5, enablePlaywright = true } = data;

    if (!query?.trim()) {
      throw new Error("Query is required");
    }

    let searchResults;

    if (enablePlaywright) {
      try {
        const playwrightService = await getWebSearchService();
        searchResults = await playwrightService.search(query, maxResults);
      } catch (error) {
        console.warn("Playwright search failed, falling back to basic search:", error);
      }
    }

    if (!searchResults || searchResults.results.length === 0) {
      const basicSearchService = new WebSearchService();
      searchResults = await basicSearchService.search(query, maxResults);
    }

    return {
      success: true,
      query: searchResults.query,
      results: searchResults.results,
      timestamp: searchResults.timestamp,
      total: searchResults.results.length
    };
  }

  private async handleImageExtraction(data: ImageExtractionRequest): Promise<any> {
    const { urls, maxImagesPerUrl = 4 } = data;

    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      throw new Error("URLs array is required");
    }

    // Limitar a máximo 5 URLs para no sobrecargar
    const limitedUrls = urls.slice(0, 5);
    
    const imageExtractor = await getImageExtractor();
    const imageGalleries = await imageExtractor.extractMultipleImages(limitedUrls, maxImagesPerUrl);

    return {
      success: true,
      galleries: imageGalleries,
      extracted: imageGalleries.length,
      total: limitedUrls.length
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