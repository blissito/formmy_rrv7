/**
 * Unified Context Processor - Single Source of Truth
 *
 * Consolida 3 flujos diferentes de vectorización en UNA función central:
 * 1. Parser API (job.service.ts)
 * 2. UI LlamaParse (embedding.service.ts)
 * 3. UI Manual Upload (contextManager.server.ts)
 *
 * Garantiza:
 * - Estructura consistente de ContextItem (TODOS los campos presentes)
 * - Inserción atómica con $push MongoDB
 * - Chunking optimizado (2000 chars, 100 overlap = 5%)
 * - Deduplicación semántica (85% threshold)
 */

import { db } from '~/utils/db.server';
import { generateEmbedding, cosineSimilarity } from '../vector/embedding.service';
import type { ContextType } from '@prisma/client';

/**
 * Configuración optimizada de chunks
 *
 * CHUNK_SIZE: 2000 chars ≈ 500 tokens → óptimo para text-embedding-3-small
 * OVERLAP: 100 chars = 5% → balance entre contexto y falsos positivos
 * THRESHOLD: 85% → solo chunks muy similares se rechazan
 */
const CHUNK_CONFIG = {
  MAX_SIZE: 2000,
  OVERLAP: 100,              // Reducido desde 200 (10%) → 100 (5%)
  SIMILARITY_THRESHOLD: 0.85
} as const;

/**
 * Retry configuration para embeddings
 */
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000;

/**
 * Sleep helper
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry wrapper con exponential backoff
 */
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  operationName: string,
  maxRetries: number = MAX_RETRIES
): Promise<T> {
  let lastError: Error | unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt < maxRetries) {
        const delay = INITIAL_RETRY_DELAY * Math.pow(2, attempt);
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
 * Reemplaza chunkText() y chunkMarkdown()
 */
function chunkContent(
  text: string,
  maxSize: number = CHUNK_CONFIG.MAX_SIZE,
  overlap: number = CHUNK_CONFIG.OVERLAP
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
 * Verifica si un chunk es semánticamente similar a embeddings existentes
 */
async function isDuplicateChunk(
  embedding: number[],
  chatbotId: string,
  threshold: number = CHUNK_CONFIG.SIMILARITY_THRESHOLD
): Promise<boolean> {
  try {
    const existingEmbeddings = await db.embedding.findMany({
      where: { chatbotId },
      select: { embedding: true },
    });

    if (existingEmbeddings.length === 0) {
      return false;
    }

    for (const existing of existingEmbeddings) {
      const similarity = cosineSimilarity(embedding, existing.embedding as number[]);

      if (similarity >= threshold) {
        console.log(`⚠️  Chunk duplicado detectado (similaridad: ${(similarity * 100).toFixed(1)}%)`);
        return true;
      }
    }

    return false;
  } catch (error) {
    console.error('Error verificando duplicados:', error);
    return false; // Fail-open: en caso de error, permitir inserción
  }
}

/**
 * Parámetros para agregar contexto
 */
export interface AddContextParams {
  chatbotId: string;
  content: string;
  metadata: {
    type: ContextType;

    // FILE específico
    fileName?: string;
    fileType?: string;
    fileSize?: number;  // bytes (se convertirá a KB)

    // LINK específico
    url?: string;

    // TEXT/QUESTION específico
    title?: string;

    // QUESTION específico
    questions?: string;
    answer?: string;

    // Metadata adicional
    routes?: string[];

    // Override de ID (opcional, para parser jobs)
    contextId?: string;
  };
}

/**
 * Resultado de agregar contexto
 */
export interface AddContextResult {
  success: boolean;
  contextId: string;
  embeddingsCreated: number;
  embeddingsSkipped: number;
  error?: string;
}

/**
 * Construye ContextItem completo y consistente
 * GARANTIZA que TODOS los campos estén presentes (usar null para no aplicables)
 */
function buildContextItem(params: AddContextParams) {
  const { metadata, content } = params;
  const sizeKB = Math.round(Buffer.byteLength(content, 'utf8') / 1024);

  // Generar ID único o usar el proporcionado
  const contextId = metadata.contextId || `ctx_${Date.now()}_${Math.random().toString(36).substring(7)}`;

  // Construir ContextItem con TODOS los campos
  return {
    id: contextId,
    type: metadata.type,

    // FILE específico
    fileName: metadata.fileName || null,
    fileType: metadata.fileType || null,
    fileUrl: null, // TODO: Agregar soporte para fileUrl en el futuro

    // LINK específico
    url: metadata.url || null,

    // TEXT/QUESTION específico
    title: metadata.title || null,

    // QUESTION específico
    questions: metadata.questions || null,
    answer: metadata.answer || null,

    // Comunes
    content,
    sizeKB,
    routes: metadata.routes || [],
    createdAt: new Date(),
  };
}

/**
 * FUNCIÓN CENTRAL - Única fuente de verdad
 *
 * Agrega contexto al chatbot con embeddings automáticos:
 * 1. Construye ContextItem completo (TODOS los campos presentes)
 * 2. Inserta con $push atómico MongoDB
 * 3. Divide en chunks optimizados
 * 4. Genera embeddings con deduplicación semántica
 * 5. Inserta embeddings en MongoDB
 */
export async function addContextWithEmbeddings(
  params: AddContextParams
): Promise<AddContextResult> {
  const { chatbotId, content } = params;

  try {
    // 1. Validar contenido
    if (!content || content.trim().length === 0) {
      return {
        success: false,
        contextId: '',
        embeddingsCreated: 0,
        embeddingsSkipped: 0,
        error: 'No hay contenido para procesar',
      };
    }

    // 2. Construir ContextItem completo
    const contextItem = buildContextItem(params);
    console.log(`📝 Creating context ${contextItem.id} (type: ${contextItem.type})`);

    // 3. Insertar con $push atómico (MongoDB)
    const { ObjectId } = await import('mongodb');

    await db.$runCommandRaw({
      update: 'Chatbot',
      updates: [
        {
          q: { _id: new ObjectId(chatbotId) },
          u: {
            $push: { contexts: contextItem },
            $inc: { contextSizeKB: contextItem.sizeKB }
          },
        },
      ],
    });

    console.log(`✅ Context added to chatbot ${chatbotId}`);

    // 4. Dividir en chunks
    const chunks = chunkContent(content);
    console.log(`📝 Verificando y creando embeddings (${chunks.length} chunks)...`);

    let created = 0;
    let skipped = 0;

    // 5. Generar embeddings para cada chunk
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];

      try {
        // Generar embedding con retry
        const embedding = await retryWithBackoff(
          () => generateEmbedding(chunk),
          `Generating embedding for chunk ${i + 1}/${chunks.length}`
        );

        // Deduplicación semántica
        const isDuplicate = await isDuplicateChunk(embedding, chatbotId);

        if (isDuplicate) {
          console.log(`⏭️  Chunk ${i + 1}/${chunks.length} saltado (duplicado semántico)`);
          skipped++;
          continue;
        }

        // Construir metadata para embedding
        const embeddingMetadata: any = {
          contextId: contextItem.id,
          contextType: contextItem.type,
          chunkIndex: i,
          totalChunks: chunks.length,
          source: 'unified-processor',
        };

        // Agregar campos relevantes según tipo
        if (contextItem.type === 'FILE') {
          embeddingMetadata.fileName = contextItem.fileName;
        } else if (contextItem.type === 'LINK') {
          embeddingMetadata.url = contextItem.url;
          embeddingMetadata.title = contextItem.title;
        } else if (contextItem.type === 'TEXT' || contextItem.type === 'QUESTION') {
          embeddingMetadata.title = contextItem.title;
        }

        // Insertar embedding
        await db.embedding.create({
          data: {
            chatbotId,
            content: chunk,
            embedding,
            metadata: embeddingMetadata,
          },
        });

        created++;
        console.log(`✅ Chunk ${i + 1}/${chunks.length} agregado (único)`);
      } catch (chunkError) {
        console.error(`Error generando embedding para chunk ${i}:`, chunkError);
        // Continuar con los demás chunks aunque falle uno
      }
    }

    console.log(
      `✅ Resultado: ${created} creados, ${skipped} duplicados (de ${chunks.length} chunks totales)`
    );

    return {
      success: true,
      contextId: contextItem.id,
      embeddingsCreated: created,
      embeddingsSkipped: skipped,
    };
  } catch (error) {
    console.error('❌ Error en addContextWithEmbeddings:', error);
    return {
      success: false,
      contextId: '',
      embeddingsCreated: 0,
      embeddingsSkipped: 0,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}

/**
 * Elimina embeddings asociados a un contexto
 */
export async function removeContextEmbeddings(
  chatbotId: string,
  contextId: string
): Promise<number> {
  const result = await db.embedding.deleteMany({
    where: {
      chatbotId,
      metadata: {
        path: ['contextId'],
        equals: contextId,
      },
    },
  });

  return result.count;
}
