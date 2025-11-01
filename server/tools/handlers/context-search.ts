/**
 * Context Search Tool Handler
 * Búsqueda semántica en la base de conocimiento del chatbot usando RAG
 * + Query Expansion para mejorar recall
 */

import type { ToolContext } from '../types';
import { vectorSearch, type VectorSearchResult } from '../../vector/vector-search.service';
import { expandQuery } from '../../vector/query-expansion.service';

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
  const { query, topK = 10 } = params;

  console.log(`\n${'🔧'.repeat(60)}`);
  console.log(`🔧 [CONTEXT SEARCH TOOL] Ejecutando búsqueda RAG`);
  console.log(`   Query: "${query}"`);
  console.log(`   TopK: ${topK}`);
  console.log(`   ChatbotId: ${context.chatbotId || 'N/A'}`);
  console.log(`${'🔧'.repeat(60)}\n`);

  // Validar que tenga chatbotId (no disponible para usuarios anónimos sin chatbot)
  if (!context.chatbotId) {
    console.log(`❌ [CONTEXT SEARCH] Sin chatbotId - bloqueando búsqueda`);
    return {
      success: false,
      message: 'No hay base de conocimiento disponible para buscar.'
    };
  }

  try {
    // 1. Expandir query en múltiples variaciones (sin LLM - más rápido)
    const expansion = await expandQuery(query, {
      maxQueries: 2,
      includeOriginal: true,
      useLLM: false // 🚀 Usar expansión simple sin LLM para velocidad
    });
    console.log(`📝 [EXPANSION] Original: "${query}"`);
    console.log(`📝 [EXPANSION] Variaciones: ${expansion.expanded.length}`);
    expansion.expanded.forEach((q, i) => {
      console.log(`   ${i + 1}. "${q}"`);
    });

    // 2. Buscar con cada query expandida
    const allResults: VectorSearchResult[] = [];
    const resultsPerQuery = Math.ceil(topK / expansion.all.length); // Dividir topK entre queries

    for (const expandedQuery of expansion.all) {
      console.log(`🔍 Buscando con: "${expandedQuery}"`);
      const results = await vectorSearch(expandedQuery, context.chatbotId, resultsPerQuery);
      console.log(`   → ${results.length} resultados (score promedio: ${results.length > 0 ? (results.reduce((sum, r) => sum + r.score, 0) / results.length).toFixed(3) : 'N/A'})`);
      allResults.push(...results);
    }

    // 3. Deduplicar por ID (mismo chunk puede aparecer en múltiples queries)
    const seen = new Set<string>();
    const uniqueResults = allResults.filter(r => {
      if (seen.has(r.id)) {
        return false;
      }
      seen.add(r.id);
      return true;
    });

    // 4. Ordenar por score (mayor a menor) y limitar a topK
    const results = uniqueResults
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);

    console.log(`✅ [SEARCH] ${results.length} resultados únicos (de ${allResults.length} totales, top score: ${results[0]?.score.toFixed(3) || 'N/A'})`);

    // 🔔 Emitir fuentes al stream si hay callback disponible
    if (context.onSourcesFound && results.length > 0) {
      context.onSourcesFound(results);
    }

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
