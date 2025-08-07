import type { SearchResult, SearchResponse } from './types';

export class WebSearchService {
  private cache = new Map<string, { data: SearchResponse; expires: number }>();
  private cacheTimeout = 15 * 60 * 1000;

  async search(query: string, numResults: number = 3): Promise<SearchResponse> {
    const cached = this.cache.get(query);
    if (cached && cached.expires > Date.now()) {
      return cached.data;
    }

    const searchResponse = await this.performSearch(query, numResults);
    
    this.cache.set(query, {
      data: searchResponse,
      expires: Date.now() + this.cacheTimeout,
    });

    return searchResponse;
  }

  private async performSearch(query: string, numResults: number): Promise<SearchResponse> {
    try {
      // Usar DuckDuckGo HTML search
      const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
      const response = await fetch(searchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        },
      });
      
      if (!response.ok) {
        console.log('Búsqueda falló, devolviendo resultados vacíos');
        return {
          query,
          timestamp: new Date(),
          results: []
        };
      }

      const html = await response.text();
      const results = await this.parseSearchResults(html, query, numResults);
      
      if (results.results.length > 0) {
        return results;
      }
      
      // Si no hay resultados, devolver vacío sin mocks
      return {
        query,
        timestamp: new Date(),
        results: []
      };
    } catch (error) {
      console.error('Error en búsqueda:', error);
      return {
        query,
        timestamp: new Date(),
        results: []
      };
    }
  }

  private async parseSearchResults(html: string, query: string, numResults: number): Promise<SearchResponse> {
    try {
      const { JSDOM } = await import('jsdom');
      const dom = new JSDOM(html);
      const document = dom.window.document;
      
      const results: SearchResult[] = [];
      const resultElements = document.querySelectorAll('.result');
      
      for (let i = 0; i < Math.min(resultElements.length, numResults); i++) {
        const element = resultElements[i];
        
        // Extraer título y URL
        const titleElement = element.querySelector('.result__title a');
        const snippetElement = element.querySelector('.result__snippet');
        
        if (titleElement && snippetElement) {
          const title = titleElement.textContent?.trim() || '';
          const url = titleElement.getAttribute('href') || '';
          const snippet = snippetElement.textContent?.trim() || '';
          
          // Intentar obtener contenido adicional de la página
          let content = snippet;
          try {
            // Para evitar hacer demasiadas requests, solo obtenemos contenido para los primeros 3 resultados
            if (i < 3 && url.startsWith('http')) {
              const pageResponse = await fetch(url, {
                headers: {
                  'User-Agent': 'Mozilla/5.0 (compatible; WebSearchBot/1.0)',
                },
                signal: AbortSignal.timeout(5000), // 5 segundos timeout
              });
              
              if (pageResponse.ok) {
                const pageHtml = await pageResponse.text();
                content = this.extractPageContent(pageHtml, snippet);
              }
            }
          } catch (error) {
            // Si falla, usar solo el snippet
            console.log('No se pudo obtener contenido adicional para:', url);
          }
          
          results.push({
            title,
            url,
            snippet,
            content,
          });
        }
      }
      
      return {
        query,
        timestamp: new Date(),
        results,
      };
    } catch (error) {
      console.error('Error parseando resultados:', error);
      return {
        query,
        timestamp: new Date(),
        results: [],
      };
    }
  }

  private extractPageContent(html: string, fallbackSnippet: string): string {
    try {
      const { JSDOM } = require('jsdom');
      const dom = new JSDOM(html);
      const document = dom.window.document;
      
      // Remover scripts y estilos
      const scripts = document.querySelectorAll('script, style, noscript');
      scripts.forEach((script: any) => script.remove());
      
      // Intentar obtener el contenido principal
      const mainContent = 
        document.querySelector('main')?.textContent ||
        document.querySelector('article')?.textContent ||
        document.querySelector('.content')?.textContent ||
        document.querySelector('#content')?.textContent ||
        document.body?.textContent ||
        '';
      
      // Limpiar y limitar el contenido
      const cleanContent = mainContent
        .replace(/\s+/g, ' ')
        .trim()
        .substring(0, 500); // Limitar a 500 caracteres
      
      return cleanContent || fallbackSnippet;
    } catch (error) {
      return fallbackSnippet;
    }
  }


  formatForLLM(searchResponse: SearchResponse): string {
    const sources = searchResponse.results
      .map((result, index) => {
        const content = result.content 
          ? `\nContenido: "${result.content}"`
          : '';
        
        return `[${index + 1}] ${result.title}
   URL: ${result.url}
   Resumen: ${result.snippet}${content}`;
      })
      .join('\n\n');

    return `BÚSQUEDA WEB: "${searchResponse.query}"

FUENTES ENCONTRADAS:
${sources}

Usa [1], [2], [3] para citar las fuentes cuando uses información de ellas.`;
  }

  formatReferences(searchResponse: SearchResponse): string {
    return searchResponse.results
      .map((result, index) => 
        `[${index + 1}] [${result.title}](${result.url})`
      )
      .join('\n');
  }
}