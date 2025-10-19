/**
 * Embedding Service for Parser - Agregar resultados de parsing al contexto
 */

import { db } from "~/utils/db.server";
import { generateEmbedding } from "server/vector/embedding.service";

/**
 * Tamaño de chunk para parsing (mismo que auto-vectorize)
 */
const MAX_CHUNK_SIZE = 2000;
const CHUNK_OVERLAP = 200;

/**
 * Divide markdown en chunks con overlap
 */
function chunkMarkdown(text: string): string[] {
  if (text.length <= MAX_CHUNK_SIZE) {
    return [text];
  }

  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    const end = Math.min(start + MAX_CHUNK_SIZE, text.length);
    const chunk = text.slice(start, end);

    // Intentar cortar en un espacio para no partir palabras
    if (end < text.length) {
      const lastSpace = chunk.lastIndexOf(" ");
      if (lastSpace > MAX_CHUNK_SIZE / 2) {
        chunks.push(chunk.slice(0, lastSpace).trim());
        start += lastSpace - CHUNK_OVERLAP;
      } else {
        chunks.push(chunk.trim());
        start += MAX_CHUNK_SIZE - CHUNK_OVERLAP;
      }
    } else {
      chunks.push(chunk.trim());
      break;
    }
  }

  return chunks.filter((c) => c.length > 0);
}

/**
 * Agregar markdown parseado al contexto del chatbot
 * Genera embeddings y los guarda en la BD
 */
export async function addMarkdownToContext(
  chatbotId: string,
  markdown: string,
  fileName: string
): Promise<{ success: boolean; embeddingsCreated: number; error?: string }> {
  try {
    if (!markdown || markdown.trim().length === 0) {
      return {
        success: false,
        embeddingsCreated: 0,
        error: "Markdown vacío",
      };
    }

    // Dividir en chunks
    const chunks = chunkMarkdown(markdown);

    console.log(
      `📝 Creando ${chunks.length} embeddings para ${fileName}...`
    );

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
              source: "llamaparse",
              fileName,
              chunkIndex: i,
              totalChunks: chunks.length,
              createdAt: new Date().toISOString(),
            },
          },
        });

        created++;
      } catch (chunkError) {
        console.error(`Error generando embedding para chunk ${i}:`, chunkError);
        // Continuar con los demás chunks aunque falle uno
      }
    }

    console.log(`✅ ${created}/${chunks.length} embeddings creados`);

    return {
      success: true,
      embeddingsCreated: created,
    };
  } catch (error) {
    console.error("❌ Error en addMarkdownToContext:", error);
    return {
      success: false,
      embeddingsCreated: 0,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}
