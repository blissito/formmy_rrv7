/**
 * Embedding Service - OpenAI text-embedding-3-small
 * Genera vectors de 768 dimensiones para RAG semántico
 */

import OpenAI from "openai";
import {
  EMBEDDING_MODEL,
  EMBEDDING_DIMENSIONS,
  validateEmbeddingDimensions,
} from "./vector-config";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Genera embedding de un texto usando OpenAI
 * @param text - Texto a convertir en vector
 * @returns Vector con dimensiones configuradas en EMBEDDING_DIMENSIONS
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  if (!text || text.trim().length === 0) {
    throw new Error("Text cannot be empty");
  }

  try {
    const response = await openai.embeddings.create({
      model: EMBEDDING_MODEL,
      input: text.trim(),
      encoding_format: "float",
      dimensions: EMBEDDING_DIMENSIONS,
    });

    const embedding = response.data[0].embedding;
    validateEmbeddingDimensions(embedding);
    return embedding;
  } catch (error) {
    console.error("Error generating embedding:", error);
    throw new Error(
      `Failed to generate embedding: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Genera embeddings para múltiples textos en batch
 * @param texts - Array de textos
 * @returns Array de vectors
 */
export async function generateEmbeddingsBatch(
  texts: string[]
): Promise<number[][]> {
  if (!texts || texts.length === 0) {
    return [];
  }

  // OpenAI permite hasta 2048 textos por request
  const batchSize = 2048;
  const results: number[][] = [];

  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts
      .slice(i, i + batchSize)
      .filter((t) => t && t.trim().length > 0);

    if (batch.length === 0) continue;

    try {
      const response = await openai.embeddings.create({
        model: EMBEDDING_MODEL,
        input: batch,
        encoding_format: "float",
        dimensions: EMBEDDING_DIMENSIONS,
      });

      const embeddings = response.data.map((d) => d.embedding);
      embeddings.forEach(validateEmbeddingDimensions);
      results.push(...embeddings);
    } catch (error) {
      console.error(
        `Error generating batch embeddings (batch ${i / batchSize + 1}):`,
        error
      );
      throw error;
    }
  }

  return results;
}

/**
 * Calcula similaridad coseno entre dos vectors
 * @param a - Vector A
 * @param b - Vector B
 * @returns Similaridad coseno (0-1)
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error("Vectors must have same dimensions");
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Estima costo de generar embeddings
 * @param textLength - Longitud del texto en caracteres
 * @returns Costo estimado en USD
 */
export function estimateEmbeddingCost(textLength: number): number {
  // text-embedding-3-small: $0.02 per 1M tokens
  // Aproximadamente 4 chars = 1 token
  const tokens = Math.ceil(textLength / 4);
  const costPerToken = 0.02 / 1_000_000;
  return tokens * costPerToken;
}
