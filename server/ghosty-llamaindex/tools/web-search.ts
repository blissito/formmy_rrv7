/**
 * Web Search Tool - Migrated from existing implementation to LlamaIndex pattern
 */

import { FunctionTool } from "llamaindex";
import type { GhostyContext } from "../types";

/**
 * Web search tool using existing unified service
 */
export const webSearchTool = FunctionTool.from(
  async ({ 
    query, 
    numResults = 5 
  }: { 
    query: string; 
    numResults?: number;
  }, context?: GhostyContext) => {
    
    console.log(`🔍 Web search: "${query}" (${numResults} results)`);

    try {
      // Import the existing web search service
      const { getUnifiedWebSearchService } = await import("~/tools/webSearchUnified.server");
      
      const searchService = await getUnifiedWebSearchService();
      const searchResults = await searchService.search(query, numResults);
      
      if (searchResults && searchResults.results && searchResults.results.length > 0) {
        console.log(`✅ Found ${searchResults.results.length} web search results`);
        
        return {
          query: searchResults.query,
          results: searchResults.results.map((r, i) => ({
            index: i + 1,
            title: r.title,
            url: r.url,
            snippet: r.snippet,
            content: r.content
          })),
          success: true
        };
      } else {
        console.log("⚠️ No web search results found");
        return {
          query,
          results: [],
          success: false,
          error: "No se pudieron obtener resultados de búsqueda en este momento."
        };
      }
    } catch (error) {
      console.error("❌ Web search error:", error);
      return {
        query,
        results: [],
        success: false,
        error: error instanceof Error ? error.message : "Error desconocido en búsqueda web"
      };
    }
  },
  {
    name: "web_search",
    description: "Busca información actualizada en la web. Úsala cuando necesites información reciente, precios, documentación, o cualquier dato que podría haber cambiado después de tu fecha de corte de conocimiento.",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "La consulta de búsqueda a realizar"
        },
        numResults: {
          type: "integer",
          description: "Número de resultados a obtener (1-10)",
          default: 5,
          minimum: 1,
          maximum: 10
        }
      },
      required: ["query"]
    }
  }
);

/**
 * Web fetch tool for getting specific webpage content
 */
export const webFetchTool = FunctionTool.from(
  async ({ 
    url 
  }: { 
    url: string;
  }, context?: GhostyContext) => {
    
    console.log(`🌐 Fetching webpage: ${url}`);

    try {
      // Import the existing fetch website action
      const { action: fetchWebsiteAction } = await import("~/routes/api.v1.fetch-website");
      
      // Mock request object for the action
      const mockRequest = {
        method: 'POST',
        json: async () => ({ url })
      } as any;

      const response = await fetchWebsiteAction({ request: mockRequest });
      
      if (!response.ok) {
        throw new Error(`Fetch failed: ${response.status}`);
      }
      
      const fetchData = await response.json();
      
      if (fetchData.error) {
        console.log("⚠️ Web fetch error:", fetchData.error);
        return {
          url,
          success: false,
          error: fetchData.error
        };
      } else {
        console.log(`✅ Successfully fetched webpage: ${url}`);
        return {
          url,
          content: fetchData.content,
          routes: fetchData.routes || [],
          success: true
        };
      }
    } catch (error) {
      console.error("❌ Web fetch error:", error);
      return {
        url,
        success: false,
        error: error instanceof Error ? error.message : "Error desconocido al obtener la página"
      };
    }
  },
  {
    name: "web_fetch",
    description: "Obtiene el contenido completo de una página web específica. Úsala cuando necesites leer el contenido detallado de un sitio web, artículo, documentación específica, o cualquier URL.",
    parameters: {
      type: "object",
      properties: {
        url: {
          type: "string",
          format: "uri",
          description: "La URL completa del sitio web a obtener (debe incluir http:// o https://)"
        }
      },
      required: ["url"]
    }
  }
);