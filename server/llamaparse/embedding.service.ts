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
 * Agrega un ContextItem al array de contexts y genera embeddings
 */
export async function addMarkdownToContext(
  chatbotId: string,
  markdown: string,
  fileName: string
): Promise<{ success: boolean; embeddingsCreated: number; contextId?: string; error?: string }> {
  try {
    if (!markdown || markdown.trim().length === 0) {
      return {
        success: false,
        embeddingsCreated: 0,
        error: "Markdown vacío",
      };
    }

    // 1. Obtener chatbot actual
    const chatbot = await db.chatbot.findUnique({
      where: { id: chatbotId },
    });

    if (!chatbot) {
      throw new Error(`Chatbot ${chatbotId} not found`);
    }

    // 2. Crear ContextItem para agregar al array
    const sizeKB = Math.round(Buffer.byteLength(markdown, "utf8") / 1024);
    const fileType = fileName.toLowerCase().endsWith(".pdf") ? "application/pdf" : "text/markdown";
    const contextId = `ctx_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    const newContextItem = {
      id: contextId,
      type: "FILE" as const,
      fileName,
      fileType,
      sizeKB,
      content: markdown, // Guardar markdown completo
      createdAt: new Date(),
      routes: [], // Campo requerido
    };

    // 3. Agregar al array de contexts del chatbot
    const existingContexts = Array.isArray(chatbot.contexts)
      ? JSON.parse(JSON.stringify(chatbot.contexts))
      : [];

    await db.chatbot.update({
      where: { id: chatbotId },
      data: {
        contexts: [...existingContexts, newContextItem],
        contextSizeKB: (chatbot.contextSizeKB || 0) + sizeKB,
      },
    });

    console.log(`📁 ContextItem agregado: ${contextId} para ${fileName}`);

    // 4. Dividir en chunks y generar embeddings
    const chunks = chunkMarkdown(markdown);

    console.log(
      `📝 Creando ${chunks.length} embeddings para ${fileName}...`
    );

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
              contextId, // Relacionar con el ContextItem
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
      contextId,
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
