/**
 * Vector Utilities - Funciones compartidas para vectorización
 *
 * Consolida código duplicado entre:
 * - unified-processor.server.ts
 * - auto-vectorize.service.ts
 */

import { generateEmbedding, cosineSimilarity } from './embedding.service';
import { db } from '~/utils/db.server';

/**
 * Configuración compartida de chunks
 */
export const VECTOR_CONFIG = {
  MAX_CHUNK_SIZE: 2000,
  CHUNK_OVERLAP: 100,        // 5% overlap optimizado
  SIMILARITY_THRESHOLD: 0.85,
  MAX_RETRIES: 3,
  INITIAL_RETRY_DELAY: 1000,
} as const;

/**
 * Sleep helper para retry delays
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry wrapper con exponential backoff
 * CONSOLIDADO desde unified-processor y auto-vectorize
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  operationName: string,
  maxRetries: number = VECTOR_CONFIG.MAX_RETRIES
): Promise<T> {
  let lastError: Error | unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt < maxRetries) {
        const delay = VECTOR_CONFIG.INITIAL_RETRY_DELAY * Math.pow(2, attempt);
        console.warn(
          `⚠️ ${operationName} failed (attempt ${attempt + 1}/${maxRetries + 1}). Retrying in ${delay}ms...`,
          error instanceof Error ? error.message : error
        );
        await sleep(delay);
      }
    }
  }

  console.error(`❌ ${operationName} failed after ${maxRetries + 1} attempts`);
  throw lastError;
}

/**
 * Chunking unificado
 * CONSOLIDADO desde unified-processor y auto-vectorize
 */
export function chunkContent(
  text: string,
  maxSize: number = VECTOR_CONFIG.MAX_CHUNK_SIZE,
  overlap: number = VECTOR_CONFIG.CHUNK_OVERLAP
): string[] {
  if (text.length <= maxSize) {
    return [text];
  }

  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    const end = Math.min(start + maxSize, text.length);
    const chunk = text.slice(start, end);

    // Intentar cortar en un espacio para no partir palabras
    if (end < text.length) {
      const lastSpace = chunk.lastIndexOf(' ');
      if (lastSpace > maxSize / 2) {
        chunks.push(chunk.slice(0, lastSpace).trim());
        start += lastSpace - overlap;
      } else {
        chunks.push(chunk.trim());
        start += maxSize - overlap;
      }
    } else {
      chunks.push(chunk.trim());
      break;
    }
  }

  return chunks.filter(c => c.length > 0);
}

/**
 * Deduplicación semántica unificada
 * CONSOLIDADO desde unified-processor y auto-vectorize
 *
 * Verifica si un chunk es semánticamente similar a embeddings existentes
 */
export async function isDuplicateChunk(
  embedding: number[],
  chatbotId: string,
  threshold: number = VECTOR_CONFIG.SIMILARITY_THRESHOLD
): Promise<boolean> {
  try {
    // Obtener TODOS los embeddings del chatbot (el "store")
    const existingEmbeddings = await db.embedding.findMany({
      where: { chatbotId },
      select: { embedding: true },
    });

    if (existingEmbeddings.length === 0) {
      return false; // No hay embeddings previos, no puede ser duplicado
    }

    // Comparar con cada embedding existente
    for (const existing of existingEmbeddings) {
      const similarity = cosineSimilarity(embedding, existing.embedding as number[]);

      if (similarity >= threshold) {
        console.log(`⚠️  Chunk duplicado detectado (similaridad: ${(similarity * 100).toFixed(1)}%)`);
        return true; // Es duplicado
      }
    }

    return false; // Es único
  } catch (error) {
    console.error('Error verificando duplicados:', error);
    return false; // Fail-open: en caso de error, permitir inserción
  }
}
