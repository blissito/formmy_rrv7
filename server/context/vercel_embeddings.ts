import { embedMany, embed } from "ai";
import { openai } from "@ai-sdk/openai";
import { chunkContent, isDuplicateChunk } from "../vector/vector-utils.server";
import {
  EMBEDDING_DIMENSIONS,
  EMBEDDING_MODEL,
  VECTOR_INDEX_NAME,
  VECTOR_SEARCH_CONFIG,
} from "../vector/vector-config";
import { db } from "../../app/utils/db.server";
import { ContextSchema } from "~/utils/zod";
import type { ContextType } from "@prisma/client";

const embeddingModel = openai.embedding(EMBEDDING_MODEL);

// Provider options to ensure correct dimensions (768 for text-embedding-3-small)
const embeddingOptions = {
  providerOptions: {
    openai: {
      dimensions: EMBEDDING_DIMENSIONS,
    },
  },
};

/**
 * Metadata completa para contextos - Soporta todos los tipos
 */
export interface ContextMetadata {
  contextType: ContextType;

  // FILE específico
  fileName?: string;
  fileType?: string;
  fileSize?: number; // bytes

  // LINK específico
  url?: string;

  // TEXT/QUESTION específico
  title?: string;

  // QUESTION específico
  questions?: string;
  answer?: string;

  // Metadata adicional
  routes?: string[];

  // Metadata de parsing (opcional, solo para Parser API)
  parsingMode?: string; // "DEFAULT" | "COST_EFFECTIVE" | "AGENTIC" | "AGENTIC_PLUS"
  parsingPages?: number;
  parsingCredits?: number;
}

export const upsert = async ({
  content,
  title,
  chatbotId,
  metadata,
}: {
  content: string;
  title: string;
  chatbotId: string;
  metadata?: ContextMetadata;
}): Promise<
  | {
      success: true;
      contextId: string;
      embeddingsCreated: number;
      embeddingsSkipped: number;
      error: undefined;
    }
  | { success: false; error: Error }
> => {
  console.log(
    `🔧 [vercel_embeddings.upsert] Iniciando para chatbot ${chatbotId}, type: ${metadata?.contextType || "TEXT"}`
  );

  try {
    // 1. Validar contenido
    if (!content || content.trim().length === 0) {
      throw new Error("No hay contenido para procesar");
    }

    // 2. Validar duplicados por URL (solo para tipo LINK)
    if (metadata?.contextType === "LINK" && metadata.url) {
      console.log(
        `🔍 [vercel_embeddings.upsert] Verificando duplicado de URL: ${metadata.url}`
      );

      // Buscar contextos LINK del chatbot y filtrar por URL en metadata
      const existingContexts = await db.context.findMany({
        where: {
          chatbotId,
          contextType: "LINK",
        },
        select: {
          id: true,
          metadata: true,
        },
      });

      const existingLink = existingContexts.find(
        (ctx) => (ctx.metadata as any)?.url === metadata.url
      );

      if (existingLink) {
        console.log(
          `⚠️ [vercel_embeddings.upsert] URL duplicada: ${metadata.url}`
        );
        throw new Error(`La URL ${metadata.url} ya existe en este chatbot`);
      }
    }

    // 3. Validar schema básico
    const {
      data,
      success,
      error: schemaError,
    } = ContextSchema.safeParse({
      content,
      title,
      chatbotId,
      contextType: metadata?.contextType || "TEXT",
    });

    if (!success) {
      throw new Error("El contexto no ha pasado la validación: " + schemaError);
    }

    // 4. Crear Context document (antes de embeddings para tener contextId)
    const sizeKB = Math.round(Buffer.byteLength(content, "utf8") / 1024);
    const newContextDocument = await db.context.create({
      data: {
        chatbotId,
        content,
        title,
        contextType: metadata?.contextType || "TEXT",
        embeddingIds: [], // Se actualizará después
        metadata: {
          fileName: metadata?.fileName || null,
          fileType: metadata?.fileType || null,
          fileSize: metadata?.fileSize || null,
          url: metadata?.url || null,
          questions: metadata?.questions || null,
          answer: metadata?.answer || null,
          routes: metadata?.routes || [],
          parsingMode: metadata?.parsingMode || null,
          parsingPages: metadata?.parsingPages || null,
          parsingCredits: metadata?.parsingCredits || null,
          sizeKB,
        },
      },
    });
    console.log(
      `✅ [vercel_embeddings.upsert] Context creado: ${newContextDocument.id}`
    );

    // 5. Chunking
    const values = chunkContent(content);
    console.log(
      `✂️ [vercel_embeddings.upsert] Chunks generados: ${values.length}`
    );

    // 6. Generar embeddings con Vercel AI SDK
    const { embeddings, values: chunks } = await embedMany({
      model: embeddingModel,
      values,
      ...embeddingOptions,
    });
    console.log(
      `🔮 [vercel_embeddings.upsert] Embeddings generados: ${embeddings.length}`
    );

    // 7. Deduplicación semántica + inserción
    let created = 0;
    let skipped = 0;
    const embeddingIds: string[] = [];

    for (let i = 0; i < embeddings.length; i++) {
      const embedding = embeddings[i];
      const chunk = chunks[i];

      try {
        // Deduplicación semántica (85% threshold)
        const isDuplicate = await isDuplicateChunk(embedding, chatbotId);

        if (isDuplicate) {
          console.log(
            `⏭️ [vercel_embeddings.upsert] Chunk ${i + 1}/${embeddings.length} duplicado, skipped`
          );
          skipped++;
          continue;
        }

        // Construir metadata del embedding
        const embeddingMetadata: any = {
          contextId: newContextDocument.id,
          contextType: metadata?.contextType || "TEXT",
          title,
          fileName: metadata?.fileName,
          url: metadata?.url,
          chunkIndex: i,
          totalChunks: embeddings.length,
          source: "vercel-ai-sdk",
        };

        // Insertar embedding
        const embeddingDoc = await db.embedding.create({
          data: {
            chatbotId,
            content: chunk,
            embedding,
            contextId: newContextDocument.id,
            metadata: embeddingMetadata,
          },
        });

        embeddingIds.push(embeddingDoc.id);
        created++;
      } catch (chunkError) {
        console.error(`❌ Error procesando chunk ${i}:`, chunkError);
        // Continuar con los demás chunks
      }
    }

    console.log(
      `🎉 [vercel_embeddings.upsert] Completado: ${created} embeddings creados, ${skipped} saltados`
    );

    // 8. Rollback si TODOS los embeddings fueron duplicados
    if (created === 0 && skipped > 0) {
      console.log(
        `⚠️ [vercel_embeddings.upsert] Todos los embeddings duplicados, eliminando Context...`
      );
      await db.context.delete({
        where: { id: newContextDocument.id },
      });

      throw new Error(
        "El contenido ya existe en tu chatbot (contenido duplicado detectado)"
      );
    }

    // 9. Actualizar Context con embeddingIds
    await db.context.update({
      where: { id: newContextDocument.id },
      data: { embeddingIds },
    });

    return {
      success: true,
      contextId: newContextDocument.id,
      embeddingsCreated: created,
      embeddingsSkipped: skipped,
      error: undefined,
    };
  } catch (err) {
    console.error("❌ [vercel_embeddings.upsert] Error:", err);
    return {
      success: false,
      error: err instanceof Error ? err : new Error(`${err}`),
    };
  }
};

export const updateContext = async ({
  contextId,
  content,
  title,
  chatbotId,
}: {
  contextId: string;
  content: string;
  title: string;
  chatbotId: string;
}): Promise<
  | {
      success: true;
      contextId: string;
      chunksCreated: number;
      error: undefined;
    }
  | { success: false; error: Error }
> => {
  try {
    // 1. Verify context exists
    const existingContext = await db.context.findUnique({
      where: { id: contextId },
    });
    if (!existingContext) {
      throw new Error("Contexto no encontrado");
    }

    // 2. Delete old embeddings
    await db.embedding.deleteMany({
      where: { contextId },
    });

    // 3. Generate new chunks and embeddings
    const values = chunkContent(content);
    const { embeddings, values: chunks } = await embedMany({
      model: embeddingModel,
      values,
      ...embeddingOptions,
    });

    // 4. Create new embeddings
    await db.embedding.createMany({
      data: embeddings.map((embedding, indx) => ({
        content: chunks[indx],
        chatbotId,
        embedding,
        contextId,
      })),
    });

    // 5. Get new embedding IDs
    const newEmbeddings = await db.embedding.findMany({
      where: { chatbotId, contextId },
    });

    // 6. Update context document
    await db.context.update({
      where: { id: contextId },
      data: {
        content,
        title,
        embeddingIds: newEmbeddings.map((e) => e.id),
      },
    });

    return {
      success: true,
      contextId,
      chunksCreated: embeddings.length,
      error: undefined,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err : new Error(`${err}`),
    };
  }
};

export const deleteContext = async ({
  contextId,
  chatbotId,
}: {
  contextId: string;
  chatbotId: string;
}): Promise<
  { success: true; error: undefined } | { success: false; error: Error }
> => {
  try {
    // 1. Verify context exists and belongs to this chatbot
    const existingContext = await db.context.findFirst({
      where: {
        id: contextId,
        chatbotId,
      },
    });

    if (!existingContext) {
      throw new Error("Contexto no encontrado o no pertenece a este chatbot");
    }

    // 2. Delete all embeddings associated with this context
    await db.embedding.deleteMany({
      where: { contextId },
    });

    // 3. Delete the context document
    await db.context.delete({
      where: { id: contextId },
    });

    return { success: true, error: undefined };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err : new Error(`${err}`),
    };
  }
};

export const vectorSearch = async ({
  chatbotId,
  value,
}: {
  chatbotId: string;
  value: string;
}): Promise<{ success: boolean; results: any[] | undefined }> => {
  // 1. convert queryString a embeding
  const queryVector = await embed({
    model: embeddingModel,
    value,
    ...embeddingOptions,
  });
  console.log("TextQuery: ", value);
  console.log("Transformed embed:", queryVector.embedding.length);
  // 2. search for similarity
  const limit = Math.min(
    VECTOR_SEARCH_CONFIG.defaultLimit, // topK
    VECTOR_SEARCH_CONFIG.maxLimit
  );
  const results = await db.embedding.aggregateRaw({
    pipeline: [
      {
        $vectorSearch: {
          index: VECTOR_INDEX_NAME,
          path: "embedding",
          queryVector: queryVector.embedding,
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
  console.log("Result::", results);
  // 2.1 log results
  // 3. use content? converto to content?
  // 4. convert chunks into full text
  // 5. return text to inject in context
  return { success: true, results: results as unknown as any[] };
};
