/**
 * Vector Search Service - MongoDB Atlas Vector Search
 * Realiza búsqueda semántica usando embeddings
 */

import { db } from '~/utils/db.server';
import { generateEmbedding } from './embedding.service';

export interface VectorSearchResult {
  id: string;
  chatbotId: string;
  content: string;
  score: number;
  metadata: {
    contextId?: string;
    contextType?: string;
    title?: string;
    fileName?: string;
    url?: string;
    chunkIndex?: number;
  };
}

/**
 * Busca contenido relevante usando vector search
 *
 * NOTA: Requiere vector search index en MongoDB Atlas:
 * - Nombre del index: "vector_index"
 * - Campo: "embedding"
 * - Dimensiones: 768
 * - Similaridad: cosine
 *
 * @param query - Texto de búsqueda
 * @param chatbotId - ID del chatbot para filtrar
 * @param topK - Número de resultados (default: 5)
 * @returns Array de resultados ordenados por relevancia
 */
export async function vectorSearch(
  query: string,
  chatbotId: string,
  topK: number = 5
): Promise<VectorSearchResult[]> {
  try {
    // 1. Generar embedding del query
    const queryEmbedding = await generateEmbedding(query);

    // 2. Realizar vector search usando $vectorSearch aggregation
    // Docs: https://www.mongodb.com/docs/atlas/atlas-vector-search/vector-search-stage/
    const results = await db.embedding.aggregateRaw({
      pipeline: [
        {
          $vectorSearch: {
            index: 'vector_index_2',
            path: 'embedding',
            queryVector: queryEmbedding,
            numCandidates: topK * 10, // Buscar más candidatos para mejor precisión
            limit: topK,
            filter: {
              chatbotId: { $oid: chatbotId }
            }
          }
        },
        {
          $project: {
            _id: 1,
            chatbotId: 1,
            content: 1,
            metadata: 1,
            score: { $meta: 'vectorSearchScore' }
          }
        }
      ]
    });

    // 3. Mapear resultados al formato esperado
    return (results as any[]).map((result: any) => ({
      id: result._id.$oid || result._id,
      chatbotId: result.chatbotId.$oid || result.chatbotId,
      content: result.content,
      score: result.score,
      metadata: result.metadata || {}
    }));
  } catch (error) {
    console.error('Vector search error:', error);

    // Si el índice no existe, dar instrucciones claras
    if (error instanceof Error && error.message.includes('index')) {
      throw new Error(
        'Vector search index not found. Please create "vector_index" in MongoDB Atlas UI. ' +
        'See /server/vector/SETUP.md for instructions.'
      );
    }

    throw error;
  }
}

/**
 * Busca usando vector search + filtro de metadata
 * @param query - Texto de búsqueda
 * @param chatbotId - ID del chatbot
 * @param filters - Filtros adicionales de metadata
 * @param topK - Número de resultados
 */
export async function vectorSearchWithFilters(
  query: string,
  chatbotId: string,
  filters: {
    contextType?: string;
    contextId?: string;
  },
  topK: number = 5
): Promise<VectorSearchResult[]> {
  const queryEmbedding = await generateEmbedding(query);

  // Construir filtro completo
  const filter: any = {
    chatbotId: { $oid: chatbotId }
  };

  if (filters.contextType) {
    filter['metadata.contextType'] = filters.contextType;
  }

  if (filters.contextId) {
    filter['metadata.contextId'] = filters.contextId;
  }

  const results = await db.embedding.aggregateRaw({
    pipeline: [
      {
        $vectorSearch: {
          index: 'vector_index_2',
          path: 'embedding',
          queryVector: queryEmbedding,
          numCandidates: topK * 10,
          limit: topK,
          filter
        }
      },
      {
        $project: {
          _id: 1,
          chatbotId: 1,
          content: 1,
          metadata: 1,
          score: { $meta: 'vectorSearchScore' }
        }
      }
    ]
  });

  return (results as any[]).map((result: any) => ({
    id: result._id.$oid || result._id,
    chatbotId: result.chatbotId.$oid || result.chatbotId,
    content: result.content,
    score: result.score,
    metadata: result.metadata || {}
  }));
}

/**
 * Obtiene estadísticas de embeddings de un chatbot
 * @param chatbotId - ID del chatbot
 */
export async function getEmbeddingStats(chatbotId: string) {
  const count = await db.embedding.count({
    where: { chatbotId }
  });

  const embeddings = await db.embedding.findMany({
    where: { chatbotId },
    select: {
      metadata: true,
      createdAt: true
    }
  });

  const contextTypes = embeddings.reduce((acc: Record<string, number>, emb: any) => {
    const type = emb.metadata?.contextType || 'unknown';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});

  return {
    totalEmbeddings: count,
    contextTypes,
    oldestEmbedding: embeddings.length > 0 ? embeddings[embeddings.length - 1].createdAt : null,
    newestEmbedding: embeddings.length > 0 ? embeddings[0].createdAt : null
  };
}
