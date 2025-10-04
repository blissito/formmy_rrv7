/**
 * Context Search Tool Handler
 * Búsqueda semántica en la base de conocimiento del chatbot usando RAG
 */

import type { ToolContext } from '../types';
import { vectorSearch, type VectorSearchResult } from '../../vector/vector-search.service';

export interface ContextSearchParams {
  query: string;
  topK?: number;
}

export interface ContextSearchResponse {
  success: boolean;
  message: string;
  data?: {
    results: VectorSearchResult[];
    totalResults: number;
  };
}

/**
 * Handler para búsqueda semántica en contextos
 */
export async function contextSearchHandler(
  params: ContextSearchParams,
  context: ToolContext
): Promise<ContextSearchResponse> {
  const { query, topK = 5 } = params;

  // Validar que tenga chatbotId (no disponible para usuarios anónimos sin chatbot)
  if (!context.chatbotId) {
    return {
      success: false,
      message: 'No hay base de conocimiento disponible para buscar.'
    };
  }

  try {
    // Realizar búsqueda vectorial
    const results = await vectorSearch(query, context.chatbotId, topK);

    if (results.length === 0) {
      return {
        success: true,
        message: `No encontré información relevante sobre "${query}" en la base de conocimiento.`,
        data: {
          results: [],
          totalResults: 0
        }
      };
    }

    // Formatear resultados para el agente
    const formattedResults = results.map((r, idx) => {
      let source = '';
      if (r.metadata.fileName) {
        source = `📄 ${r.metadata.fileName}`;
      } else if (r.metadata.url) {
        source = `🔗 ${r.metadata.url}`;
      } else if (r.metadata.title) {
        source = `📝 ${r.metadata.title}`;
      }

      return `
**Resultado ${idx + 1}** (relevancia: ${(r.score * 100).toFixed(1)}%)
${source ? `Fuente: ${source}\n` : ''}
Contenido: ${r.content}
`.trim();
    });

    const message = `Encontré ${results.length} resultado(s) relevante(s) sobre "${query}":\n\n${formattedResults.join('\n\n---\n\n')}`;

    return {
      success: true,
      message,
      data: {
        results,
        totalResults: results.length
      }
    };
  } catch (error) {
    console.error('[context-search] Error:', error);

    // Error específico si no existe el índice
    if (error instanceof Error && error.message.includes('index')) {
      return {
        success: false,
        message: 'La búsqueda semántica aún no está configurada para este chatbot. Contacta al administrador.'
      };
    }

    return {
      success: false,
      message: 'Error al buscar en la base de conocimiento. Por favor intenta de nuevo.'
    };
  }
}
