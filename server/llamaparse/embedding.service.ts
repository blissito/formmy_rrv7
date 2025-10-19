/**
 * Embedding Service for Parser - Agregar resultados de parsing al contexto
 */

import { db } from "~/utils/db.server";
import { generateEmbedding, cosineSimilarity } from "server/vector/embedding.service";

/**
 * Tamaño de chunk para parsing (mismo que auto-vectorize)
 */
const MAX_CHUNK_SIZE = 2000;
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
): Promise<{ success: boolean; embeddingsCreated: number; embeddingsSkipped?: number; contextId?: string; error?: string }> {
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
      `📝 Verificando y creando embeddings para ${fileName} (${chunks.length} chunks)...`
    );

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

        // Insertar solo si NO es duplicado
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
      embeddingsSkipped: skipped,
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
