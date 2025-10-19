/**
 * Vector Search Configuration
 *
 * Configuración centralizada para MongoDB Atlas Vector Search.
 * Permite fácil actualización de nombres de índices entre diferentes instancias/databases.
 *
 * SETUP:
 * 1. Configura VECTOR_INDEX_NAME en .env (opcional, usa default si no existe)
 * 2. Crea el índice en MongoDB Atlas con ese nombre
 * 3. Usa la configuración JSON de ATLAS_VECTOR_INDEX_CONFIG
 */

/**
 * Nombre del índice de vector search en MongoDB Atlas
 *
 * Override con variable de entorno:
 * VECTOR_INDEX_NAME=vector_index_prod
 *
 * Default: vector_index_bliss
 */
export const VECTOR_INDEX_NAME = process.env.VECTOR_INDEX_NAME || 'vector_index_bliss';

/**
 * Configuración del índice para Atlas
 *
 * Copia este JSON al crear el índice en MongoDB Atlas:
 * Database → Collection → Search Indexes → Create Search Index → JSON Editor
 */
export const ATLAS_VECTOR_INDEX_CONFIG = {
  fields: [
    {
      type: 'vector',
      path: 'embedding',
      numDimensions: 768,
      similarity: 'cosine'
    },
    {
      type: 'filter',
      path: 'chatbotId'
    }
  ]
} as const;

/**
 * Dimensiones del embedding
 *
 * Debe coincidir con el modelo de embeddings usado:
 * - text-embedding-3-small: 768 (default) ✅
 * - text-embedding-3-large: 3072
 * - text-embedding-ada-002: 1536
 */
export const EMBEDDING_DIMENSIONS = 768;

/**
 * Modelo de embeddings de OpenAI
 */
export const EMBEDDING_MODEL = 'text-embedding-3-small';

/**
 * Configuración de búsqueda vectorial
 */
export const VECTOR_SEARCH_CONFIG = {
  /**
   * Número de candidatos a buscar (debe ser >= limit)
   * Mayor = más preciso pero más lento
   * Recomendado: limit * 10
   */
  numCandidatesMultiplier: 10,

  /**
   * Límite de resultados por defecto
   */
  defaultLimit: 5,

  /**
   * Límite máximo de resultados
   */
  maxLimit: 50
} as const;

/**
 * Helper para obtener la configuración del índice como string JSON
 * para documentación o logs
 */
export function getIndexConfigJSON(): string {
  return JSON.stringify(ATLAS_VECTOR_INDEX_CONFIG, null, 2);
}

/**
 * Validar que las dimensiones del embedding coincidan con la config
 */
export function validateEmbeddingDimensions(embedding: number[]): void {
  if (embedding.length !== EMBEDDING_DIMENSIONS) {
    throw new Error(
      `Invalid embedding dimensions: expected ${EMBEDDING_DIMENSIONS}, got ${embedding.length}`
    );
  }
}
