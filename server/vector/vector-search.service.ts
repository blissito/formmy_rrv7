/**
 * Vector Search Service - MongoDB Atlas Vector Search
 * Realiza búsqueda semántica usando embeddings
 */

import { db } from "~/utils/db.server";
import { generateEmbedding } from "./embedding.service";
import {
  VECTOR_INDEX_NAME,
  VECTOR_SEARCH_CONFIG,
  getIndexConfigJSON,
} from "./vector-config";

export interface VectorSearchResult {
  id: string;
  chatbotId: string;
  content: string;
  score: number;
  metadata: {
    contextId?: string;
    contextType?: string;
    title?: string;
    fileName?: string | null;
    url?: string | null;
    chunkIndex?: number;
  };
}

/**
 * Helper para obtener un nombre legible de la fuente del resultado
 * Prioriza: fileName > title > url > "Unknown"
 */
export function getSourceName(
  metadata: VectorSearchResult["metadata"]
): string {
  if (metadata.fileName) {
    return metadata.fileName;
  }
  if (metadata.title) {
    return metadata.title;
  }
  if (metadata.url) {
    // Extraer dominio de la URL para display más limpio
    try {
      const urlObj = new URL(metadata.url);
      return urlObj.hostname;
    } catch {
      return metadata.url;
    }
  }
  return "Unknown";
}

/**
 * Helper para obtener el tipo de fuente legible
 */
export function getSourceType(
  metadata: VectorSearchResult["metadata"]
): string {
  if (metadata.contextType === "FILE") return "📄 File";
  if (metadata.contextType === "LINK") return "🔗 Web";
  if (metadata.contextType === "TEXT") return "📝 Text";
  if (metadata.contextType === "QUESTION") return "💬 FAQ";
  return "❓ Unknown";
}

/**
 * Busca contenido relevante usando vector search
 *
 * SETUP: Requiere vector search index en MongoDB Atlas.
 * Nombre del índice: configurado en VECTOR_INDEX_NAME
 * Configuración JSON: ver getIndexConfigJSON()
 *
 * @param query - Texto de búsqueda
 * @param chatbotId - ID del chatbot para filtrar
 * @param topK - Número de resultados (default: 5)
 * @returns Array de resultados ordenados por relevancia
 */
export async function vectorSearch(
  query: string,
  chatbotId: string,
  topK: number = VECTOR_SEARCH_CONFIG.defaultLimit
): Promise<VectorSearchResult[]> {
  try {
    console.log(`\n${"🔍".repeat(60)}`);
    console.log(`🔍 [VECTOR SEARCH] INICIO`);
    console.log(`   Query: "${query}"`);
    console.log(`   ChatbotId: ${chatbotId}`);
    console.log(`   TopK: ${topK}`);
    console.log(`${"🔍".repeat(60)}\n`);

    // Validar límite
    const limit = Math.min(topK, VECTOR_SEARCH_CONFIG.maxLimit);

    // 1. Generar embedding del query
    console.log(`📊 Generando embedding para query...`);
    const queryEmbedding = await generateEmbedding(query);
    console.log(`✅ Embedding generado: ${queryEmbedding.length} dimensiones`);

    // 2. Realizar vector search usando $vectorSearch aggregation
    // Docs: https://www.mongodb.com/docs/atlas/atlas-vector-search/vector-search-stage/
    // IMPORTANTE: chatbotId es ObjectId en MongoDB, necesita formato { $oid: id }
    const results = await db.embedding.aggregateRaw({
      pipeline: [
        {
          $vectorSearch: {
            index: VECTOR_INDEX_NAME,
            path: "embedding",
            queryVector: queryEmbedding,
            numCandidates: limit * VECTOR_SEARCH_CONFIG.numCandidatesMultiplier,
            limit,
            filter: {
              chatbotId: { $oid: chatbotId },
            },
          },
        },
        {
          $project: {
            _id: 1,
            chatbotId: 1,
            content: 1,
            metadata: 1,
            score: { $meta: "vectorSearchScore" },
          },
        },
      ],
    });

    const resultsArray = results as unknown as any[];

    console.log(`\n📊 Vector Search completado:`);
    console.log(`   Resultados encontrados: ${resultsArray.length}`);

    if (resultsArray.length > 0) {
      console.log(`\n📄 Top ${Math.min(3, resultsArray.length)} resultados:`);
      resultsArray.slice(0, 3).forEach((r: any, idx: number) => {
        console.log(`\n   ${idx + 1}. Score: ${r.score?.toFixed(4) || "N/A"}`);
        console.log(`      Content: ${r.content?.substring(0, 100)}...`);
        console.log(
          `      Metadata:`,
          JSON.stringify(r.metadata || {}, null, 2)
        );
      });
    } else {
      console.log(`   ⚠️  NO se encontraron resultados para query: "${query}"`);
    }
    console.log(`\n${"🔍".repeat(60)}\n`);

    // 3. Mapear resultados al formato esperado
    return resultsArray.map((result: any) => ({
      id: result._id.$oid || result._id,
      chatbotId: result.chatbotId.$oid || result.chatbotId,
      content: result.content,
      score: result.score,
      metadata: result.metadata || {},
    }));
  } catch (error) {
    console.error("[Vector Search] Error:", error);

    // Si el índice no existe, dar instrucciones claras
    if (error instanceof Error && error.message.includes("index")) {
      throw new Error(
        `Vector search index "${VECTOR_INDEX_NAME}" not found in MongoDB Atlas.\n` +
          `Create it with this configuration:\n${getIndexConfigJSON()}\n` +
          `See server/vector/vector-config.ts for details.`
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
  topK: number = VECTOR_SEARCH_CONFIG.defaultLimit
): Promise<VectorSearchResult[]> {
  // Validar límite
  const limit = Math.min(topK, VECTOR_SEARCH_CONFIG.maxLimit);

  const queryEmbedding = await generateEmbedding(query);

  // Construir filtro completo
  // IMPORTANTE: chatbotId es ObjectId en MongoDB, necesita formato { $oid: id }
  const filter: any = {
    chatbotId: { $oid: chatbotId },
  };

  if (filters.contextType) {
    filter["metadata.contextType"] = filters.contextType;
  }

  if (filters.contextId) {
    filter["metadata.contextId"] = filters.contextId;
  }

  const results = await db.embedding.aggregateRaw({
    pipeline: [
      {
        $vectorSearch: {
          index: VECTOR_INDEX_NAME,
          path: "embedding",
          queryVector: queryEmbedding,
          numCandidates: limit * VECTOR_SEARCH_CONFIG.numCandidatesMultiplier,
          limit,
          filter,
        },
      },
      {
        $project: {
          _id: 1,
          chatbotId: 1,
          content: 1,
          metadata: 1,
          score: { $meta: "vectorSearchScore" },
        },
      },
    ],
  });

  const resultsArray = results as unknown as any[];

  return resultsArray.map((result: any) => ({
    id: result._id.$oid || result._id,
    chatbotId: result.chatbotId.$oid || result.chatbotId,
    content: result.content,
    score: result.score,
    metadata: result.metadata || {},
  }));
}

/**
 * Obtiene estadísticas de embeddings de un chatbot
 * @param chatbotId - ID del chatbot
 */
export async function getEmbeddingStats(chatbotId: string) {
  const count = await db.embedding.count({
    where: { chatbotId },
  });

  const embeddings = await db.embedding.findMany({
    where: { chatbotId },
    select: {
      metadata: true,
      createdAt: true,
    },
  });

  const contextTypes = embeddings.reduce(
    (acc: Record<string, number>, emb: any) => {
      const type = emb.metadata?.contextType || "unknown";
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    },
    {}
  );

  return {
    totalEmbeddings: count,
    contextTypes,
    oldestEmbedding:
      embeddings.length > 0
        ? embeddings[embeddings.length - 1].createdAt
        : null,
    newestEmbedding: embeddings.length > 0 ? embeddings[0].createdAt : null,
  };
}

// NEW VERCEL SERVICES
