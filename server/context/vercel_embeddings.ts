import { embedMany } from "ai";
import { openai } from "@ai-sdk/openai";
import { chunkContent } from "../vector/vector-utils.server";

const embeddingModel = openai.embedding("text-embedding-ada-002");

export const vectorize = async (text: string) => {
  // 1. chunking
  const values = chunkContent(text);
  console.log("Chunks", values);
  // 2. embeddings
  const { embeddings } = await embedMany({
    model: embeddingModel,
    values,
  });
  console.log("Embeddings: ", embeddings);
  // 3. insertion
  // Work in Progress (mongodb o postgres? 🤔)
};
