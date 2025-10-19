/**
 * Auto-vectorization service
 * Genera embeddings automáticamente cuando se añaden contextos
 */

import { db } from '~/utils/db.server';
import { generateEmbedding, cosineSimilarity } from './embedding.service';
import type { ContextItem } from '@prisma/client';

/**
 * Tamaño máximo de chunk en caracteres (aproximadamente 512 tokens)
 */
const MAX_CHUNK_SIZE = 2000;

/**
 * Overlap entre chunks para mantener contexto
 */
const CHUNK_OVERLAP = 200;

/**
 * Umbral de similaridad semántica para prevenir duplicados
 * Si un chunk tiene > 85% similaridad con alguno existente, se considera duplicado
 */
const SIMILARITY_THRESHOLD = 0.85;

/**
 * Verifica si un chunk es semánticamente similar a algún embedding existente en el store
 * @param chunkEmbedding - Embedding del chunk a verificar
 * @param chatbotId - ID del chatbot (define el "store")
 * @returns true si es duplicado, false si es único
 */
async function isDuplicateChunk(
  chunkEmbedding: number[],
  chatbotId: string
): Promise<boolean> {
  try {
    // Obtener TODOS los embeddings del chatbot (el "store")
    const existingEmbeddings = await db.embedding.findMany({
      where: { chatbotId },
      select: {
        embedding: true,
      },
    });

    if (existingEmbeddings.length === 0) {
      return false; // No hay embeddings previos, no puede ser duplicado
    }

    // Comparar con cada embedding existente
    for (const existing of existingEmbeddings) {
      const similarity = cosineSimilarity(chunkEmbedding, existing.embedding as number[]);

      if (similarity >= SIMILARITY_THRESHOLD) {
        console.log(`⚠️  Chunk duplicado detectado (similaridad: ${(similarity * 100).toFixed(1)}%)`);
        return true; // Es duplicado
      }
    }

    return false; // Es único
  } catch (error) {
    console.error("Error verificando duplicados:", error);
    // En caso de error, permitir inserción (fail-open)
    return false;
  }
}

/**
 * Divide texto largo en chunks con overlap
 */
function chunkText(text: string, maxSize: number = MAX_CHUNK_SIZE, overlap: number = CHUNK_OVERLAP): string[] {
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
 * Extrae texto procesable de un ContextItem
 */
function extractTextFromContext(context: ContextItem): string {
  const parts: string[] = [];

  // Título siempre incluido
  if (context.title) {
    parts.push(`# ${context.title}`);
  }

  // Contenido según tipo
  switch (context.type) {
    case 'TEXT':
    case 'FILE':
    case 'LINK':
      if (context.content) {
        parts.push(context.content);
      }
      break;

    case 'QUESTION':
      if (context.questions) {
        parts.push(`Pregunta: ${context.questions}`);
      }
      if (context.answer) {
        parts.push(`Respuesta: ${context.answer}`);
      }
      break;
  }

  // Metadata adicional
  if (context.type === 'FILE' && context.fileName) {
    parts.push(`Archivo: ${context.fileName}`);
  }
  if (context.type === 'LINK' && context.url) {
    parts.push(`URL: ${context.url}`);
  }

  return parts.join('\n\n');
}

/**
 * Genera embeddings para un contexto y los guarda en BD
 */
export async function vectorizeContext(
  chatbotId: string,
  context: ContextItem
): Promise<{ success: boolean; embeddingsCreated: number; embeddingsSkipped?: number; error?: string }> {
  try {
    // Extraer texto
    const fullText = extractTextFromContext(context);

    if (!fullText || fullText.trim().length === 0) {
      return {
        success: false,
        embeddingsCreated: 0,
        error: 'No hay texto para vectorizar'
      };
    }

    // Dividir en chunks si es necesario
    const chunks = chunkText(fullText);

    console.log(`📝 Verificando y creando embeddings (${chunks.length} chunks)...`);

    // Generar embeddings para cada chunk
    let created = 0;
    let skipped = 0;

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];

      try {
        // Generar embedding del chunk
        const embedding = await generateEmbedding(chunk);

        // ⭐ TEST SEMÁNTICO a nivel de STORE (todos los documentos del chatbot)
        const isDuplicate = await isDuplicateChunk(embedding, chatbotId);

        if (isDuplicate) {
          console.log(`⏭️  Chunk ${i + 1}/${chunks.length} saltado (duplicado semántico)`);
          skipped++;
          continue; // NO insertar chunk duplicado
        }

        // Construir metadata con valores fallback según el tipo
        // IMPORTANTE: Garantizar que siempre haya al menos un identificador válido
        let title = context.title;
        let fileName = context.fileName;
        let url = context.url;

        // Aplicar fallbacks según el tipo de contexto
        switch (context.type) {
          case 'FILE':
            // Para archivos, fileName es prioritario
            fileName = fileName || title || 'Unnamed file';
            break;
          case 'LINK':
            // Para links, title y url son prioritarios
            title = title || (url ? new URL(url).hostname : 'Unnamed link');
            break;
          case 'TEXT':
            // Para texto, title es prioritario
            title = title || 'Unnamed text';
            break;
          case 'QUESTION':
            // Para FAQs, usar la pregunta como title
            title = title || context.questions || 'Unnamed question';
            break;
        }

        // Insertar solo si NO es duplicado
        await db.embedding.create({
          data: {
            chatbotId,
            content: chunk,
            embedding,
            metadata: {
              contextId: context.id,
              contextType: context.type,
              title,
              fileName,
              url,
              chunkIndex: i,
              totalChunks: chunks.length,
              source: 'auto-vectorize'
            }
          }
        });

        created++;
        console.log(`✅ Chunk ${i + 1}/${chunks.length} agregado (único)`);
      } catch (chunkError) {
        console.error(`Error generando embedding para chunk ${i}:`, chunkError);
        // Continuar con los demás chunks aunque falle uno
      }
    }

    console.log(`✅ Resultado: ${created} creados, ${skipped} duplicados (de ${chunks.length} chunks totales)`);

    return {
      success: true,
      embeddingsCreated: created,
      embeddingsSkipped: skipped
    };

  } catch (error: any) {
    console.error('Error en vectorizeContext:', error);
    return {
      success: false,
      embeddingsCreated: 0,
      error: error.message
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
        equals: contextId
      }
    }
  });

  return result.count;
}

/**
 * Re-vectoriza un contexto (elimina anteriores + crea nuevos)
 */
export async function revectorizeContext(
  chatbotId: string,
  context: ContextItem
): Promise<{ success: boolean; embeddingsCreated: number; embeddingsDeleted: number; error?: string }> {
  try {
    // Eliminar embeddings anteriores de este contexto
    const deleted = await removeContextEmbeddings(chatbotId, context.id);

    // Generar nuevos embeddings
    const result = await vectorizeContext(chatbotId, context);

    return {
      ...result,
      embeddingsDeleted: deleted
    };

  } catch (error: any) {
    return {
      success: false,
      embeddingsCreated: 0,
      embeddingsDeleted: 0,
      error: error.message
    };
  }
}
