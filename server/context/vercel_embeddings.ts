import { embedMany, embed } from "ai";
import { openai } from "@ai-sdk/openai";
import { chunkContent } from "../vector/vector-utils.server";
import {
  EMBEDDING_DIMENSIONS,
  EMBEDDING_MODEL,
  VECTOR_INDEX_NAME,
  VECTOR_SEARCH_CONFIG,
} from "../vector/vector-config";
import { db } from "../../app/utils/db.server";
import { ContextSchema } from "~/utils/zod";
import type { Context } from "@prisma/client";

const embeddingModel = openai.embedding(EMBEDDING_MODEL);

// Provider options to ensure correct dimensions (768 for text-embedding-3-small)
const embeddingOptions = {
  providerOptions: {
    openai: {
      dimensions: EMBEDDING_DIMENSIONS,
    },
  },
};

export const upsert = async ({
  content,
  title,
  chatbotId,
}: {
  content: string;
  title: string;
  chatbotId: string;
}): Promise<
  | { success: true; contextId: string; error: undefined }
  | { success: false; error: Error }
> => {
  try {
    // 1. chunking
    const values = chunkContent(content);
    // 2. embeddings
    const { embeddings, values: chunks } = await embedMany({
      model: embeddingModel,
      values,
      ...embeddingOptions,
    });
    // 3. insertion
    // 3.0- validate duplication
    // 3.0.1- avoid duplication
    // 3.1- One context item for full content
    // 3.2- One embedding document for every chunk
    // 3.3- Update context to relate everything

    // 3.0: TODO
    const { data, success, error } = ContextSchema.safeParse({
      content,
      title,
      chatbotId,
    });
    if (!success) {
      throw new Error("El contexto no ha pasado la validación: " + error);
    }
    // 3.0.1 avoid duplication
    // @TODO usar hash en el futuro?
    const existingContext = await db.context.findFirst({
      where: {
        title,
        chatbotId,
      },
    });
    if (existingContext) {
      throw new Error("Contexto existente :3");
    }
    // 3.1:
    const newContextDocument = await db.context.create({
      data: data as Context,
    });
    console.log("NUEVO contexto::", newContextDocument.id);

    // 3.2:
    // this doesn't return ids
    await db.embedding.createMany({
      data: embeddings.map((embedding, indx) => ({
        content: chunks[indx], // important!
        chatbotId,
        embedding,
        contextId: newContextDocument.id,
      })),
    });
    // 3.3:
    // we need the ids
    const embedings = await db.embedding.findMany({
      where: {
        chatbotId,
        contextId: newContextDocument.id,
      },
    });
    await db.context.update({
      where: {
        id: newContextDocument.id,
      },
      data: {
        embeddingIds: [
          // revisit @todo
          ...newContextDocument.embeddingIds,
          ...embedings.map((embedding) => embedding.id),
        ],
      },
    });
    return { success: true, contextId: newContextDocument.id };
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
}) => {
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
  return { success: true };
};
