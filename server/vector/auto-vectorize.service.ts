/**
 * Auto-vectorization service
 * Genera embeddings automáticamente cuando se añaden contextos
 */

import { db } from '~/utils/db.server';
import { generateEmbedding } from './embedding.service';
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
): Promise<{ success: boolean; embeddingsCreated: number; error?: string }> {
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

    // Generar embeddings para cada chunk
    let created = 0;
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      
      try {
        const embedding = await generateEmbedding(chunk);

        await db.embedding.create({
          data: {
            chatbotId,
            content: chunk,
            embedding,
            metadata: {
              contextId: context.id,
              contextType: context.type,
              title: context.title,
              fileName: context.fileName,
              url: context.url,
              chunkIndex: i,
              totalChunks: chunks.length,
              source: 'auto-vectorize'
            }
          }
        });

        created++;
      } catch (chunkError) {
        console.error(`Error generando embedding para chunk ${i}:`, chunkError);
        // Continuar con los demás chunks aunque falle uno
      }
    }

    return {
      success: true,
      embeddingsCreated: created
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
