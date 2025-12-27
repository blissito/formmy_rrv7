/**
 * Vector Utilities - Funciones compartidas para vectorización
 *
 * Consolida código duplicado entre:
 * - unified-processor.server.ts (DEPRECADO)
 * - auto-vectorize.service.ts (DEPRECADO)
 * - vercel_embeddings.ts (ACTIVO)
 */

import { db } from "~/utils/db.server";

/**
 * Configuración compartida de chunks
 */
export const VECTOR_CONFIG = {
  MAX_CHUNK_SIZE: 2000,
  CHUNK_OVERLAP: 100, // 5% overlap - Balance entre granularidad y coverage
  SIMILARITY_THRESHOLD: 0.85,
  MAX_RETRIES: 3,
  INITIAL_RETRY_DELAY: 1000,
} as const;

/**
 * Sleep helper para retry delays
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
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
      const lastSpace = chunk.lastIndexOf(" ");
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

  return chunks.filter((c) => c.length > 0);
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
      const similarity = cosineSimilarity(
        embedding,
        existing.embedding as number[]
      );

      if (similarity >= threshold) {
        return true; // Es duplicado
      }
    }

    return false; // Es único
  } catch (error) {
    console.error("Error verificando duplicados:", error);
    return false; // Fail-open: en caso de error, permitir inserción
  }
}

/**
 * Chunking por delimitador para catálogos de productos
 * Cada producto/fila se mantiene como chunk individual completo
 *
 * @param text - Contenido con delimitadores ---PRODUCT---
 * @param delimiter - Delimitador a usar (default: ---PRODUCT---)
 * @param maxChunkSize - Tamaño máximo de chunk (si un producto excede, se trunca)
 * @returns Array de chunks, cada uno representando un producto completo
 */
export function chunkByDelimiter(
  text: string,
  delimiter: string = "---PRODUCT---",
  maxChunkSize: number = VECTOR_CONFIG.MAX_CHUNK_SIZE
): string[] {
  const products = text
    .split(delimiter)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  // Si un producto excede el tamaño máximo, lo truncamos
  // (mejor truncar que perder coherencia dividiendo)
  return products.map((product) => {
    if (product.length > maxChunkSize) {
      console.warn(
        `⚠️ [chunkByDelimiter] Producto truncado: ${product.length} → ${maxChunkSize} chars`
      );
      return product.slice(0, maxChunkSize);
    }
    return product;
  });
}

/**
 * Detecta si el contenido es un catálogo de productos
 * Busca el delimitador especial ---PRODUCT---
 */
export function isCatalogContent(text: string): boolean {
  return text.includes("---PRODUCT---");
}

/**
 * Calcula similaridad coseno entre dos vectors
 * Función matemática pura (no depende de ningún servicio externo)
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
