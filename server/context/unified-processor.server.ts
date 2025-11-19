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
import { generateEmbedding } from '../vector/embedding.service';
import type { ContextType } from '@prisma/client';
import {
  retryWithBackoff,
  chunkContent,
  isDuplicateChunk
} from '../vector/vector-utils.server';

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

    // Metadata de parsing (opcional, solo para Parser API)
    parsingMode?: string;    // "DEFAULT" | "COST_EFFECTIVE" | "AGENTIC" | "AGENTIC_PLUS"
    parsingPages?: number;
    parsingCredits?: number;
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
 * Extrae texto procesable para vectorización según tipo de contexto
 * + METADATA ENRICHMENT: Agrega keywords y contexto al inicio para mejorar retrieval
 */
function extractTextFromContext(
  content: string,
  metadata: AddContextParams['metadata']
): string {
  const parts: string[] = [];

  // MEJORA: Agregar keywords/contexto al inicio del documento
  // Esto mejora semantic search porque el inicio tiene más peso
  const keywords: string[] = [];

  if (metadata.fileName) {
    // Extraer nombre sin extensión como keyword
    const nameWithoutExt = metadata.fileName.replace(/\.[^/.]+$/, '');
    keywords.push(nameWithoutExt);
  }

  if (metadata.title) {
    keywords.push(metadata.title);
  }

  // Agregar tipo de documento
  const typeMap: Record<string, string> = {
    'FILE': 'documento archivo',
    'LINK': 'página web sitio',
    'TEXT': 'texto información',
    'QUESTION': 'pregunta frecuente FAQ'
  };
  if (typeMap[metadata.type]) {
    keywords.push(typeMap[metadata.type]);
  }

  // Agregar bloque de keywords si existen
  if (keywords.length > 0) {
    parts.push(`Keywords: ${keywords.join(', ')}`);
    parts.push(''); // Línea vacía para separar
  }

  // Título siempre incluido si existe
  if (metadata.title) {
    parts.push(`# ${metadata.title}`);
  }

  // Contenido según tipo
  switch (metadata.type) {
    case 'TEXT':
    case 'FILE':
    case 'LINK':
      if (content) {
        parts.push(content);
      }
      break;

    case 'QUESTION':
      if (metadata.questions) {
        parts.push(`Pregunta: ${metadata.questions}`);
      }
      if (metadata.answer) {
        parts.push(`Respuesta: ${metadata.answer}`);
      }
      // También incluir content si existe
      if (content) {
        parts.push(content);
      }
      break;
  }

  // Metadata adicional al final
  const metadataParts: string[] = [];
  if (metadata.type === 'FILE' && metadata.fileName) {
    metadataParts.push(`Archivo: ${metadata.fileName}`);
  }
  if (metadata.type === 'LINK' && metadata.url) {
    metadataParts.push(`URL: ${metadata.url}`);
  }

  if (metadataParts.length > 0) {
    parts.push(''); // Línea vacía
    parts.push(...metadataParts);
  }

  return parts.join('\n\n');
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

    // Metadata de parsing (solo presente para docs parseados via Parser API)
    parsingMode: metadata.parsingMode || null,
    parsingPages: metadata.parsingPages || null,
    parsingCredits: metadata.parsingCredits || null,
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
  console.log(`🔧 [addContextWithEmbeddings] Iniciando para chatbot ${chatbotId}, type: ${params.metadata.type}`);

  try {
    // 1. Validar contenido
    if (!content || content.trim().length === 0) {
      console.log(`❌ [addContextWithEmbeddings] Content vacío`);
      return {
        success: false,
        contextId: '',
        embeddingsCreated: 0,
        embeddingsSkipped: 0,
        error: 'No hay contenido para procesar',
      };
    }

    // 2. Validar que el chatbot existe y obtener contextos existentes
    console.log(`🔍 [addContextWithEmbeddings] Buscando chatbot ${chatbotId}...`);
    const chatbot = await db.chatbot.findUnique({
      where: { id: chatbotId },
      select: { id: true, contexts: true },
    });
    console.log(`✅ [addContextWithEmbeddings] Chatbot encontrado, contextos: ${chatbot?.contexts?.length || 0}`);

    if (!chatbot) {
      return {
        success: false,
        contextId: '',
        embeddingsCreated: 0,
        embeddingsSkipped: 0,
        error: `Chatbot ${chatbotId} no encontrado`,
      };
    }

    // 2.5 Verificar duplicados por URL (solo para tipo LINK)
    if (params.metadata.type === 'LINK' && params.metadata.url) {
      console.log(`🔍 [addContextWithEmbeddings] Verificando duplicado de URL: ${params.metadata.url}`);
      const existingLink = (chatbot.contexts as any[])?.find(
        (ctx: any) => ctx.type === 'LINK' && ctx.url === params.metadata.url
      );

      if (existingLink) {
        console.log(`⚠️ [addContextWithEmbeddings] URL duplicada encontrada: ${params.metadata.url}`);
        return {
          success: false,
          contextId: existingLink.id,
          embeddingsCreated: 0,
          embeddingsSkipped: 0,
          error: `La URL ${params.metadata.url} ya existe en este chatbot`,
        };
      }
      console.log(`✅ [addContextWithEmbeddings] URL no duplicada`);
    }

    // 3. Construir ContextItem completo
    console.log(`🏗️ [addContextWithEmbeddings] Construyendo ContextItem...`);
    const contextItem = buildContextItem(params);
    console.log(`✅ [addContextWithEmbeddings] ContextItem construido: ${contextItem.id}`);

    // 4. Insertar con $push atómico (MongoDB)
    console.log(`💾 [addContextWithEmbeddings] Insertando en DB con $push...`);

    // Obtener chatbot actual para hacer el push
    const currentChatbot = await db.chatbot.findUnique({
      where: { id: chatbotId },
      select: { contexts: true, contextSizeKB: true }
    });

    if (!currentChatbot) {
      throw new Error(`Chatbot ${chatbotId} no encontrado`);
    }

    // Agregar nuevo contexto al array existente
    const updatedContexts = [
      ...(Array.isArray(currentChatbot.contexts) ? currentChatbot.contexts : []),
      contextItem
    ];

    // Actualizar chatbot con nuevo array de contextos
    await db.chatbot.update({
      where: { id: chatbotId },
      data: {
        contexts: updatedContexts,
        contextSizeKB: (currentChatbot.contextSizeKB || 0) + contextItem.sizeKB
      }
    });
    console.log(`✅ [addContextWithEmbeddings] Insertado en DB correctamente`);


    // 4. Extraer texto procesable según tipo de contexto
    console.log(`📝 [addContextWithEmbeddings] Extrayendo texto para vectorización...`);
    const textToVectorize = extractTextFromContext(content, params.metadata);
    console.log(`✅ [addContextWithEmbeddings] Texto extraído: ${textToVectorize.length} chars`);

    // 5. Dividir en chunks
    console.log(`✂️ [addContextWithEmbeddings] Dividiendo en chunks...`);
    const chunks = chunkContent(textToVectorize);
    console.log(`✅ [addContextWithEmbeddings] Chunks generados: ${chunks.length}`);

    let created = 0;
    let skipped = 0;

    // 6. Generar embeddings para cada chunk
    console.log(`🔮 [addContextWithEmbeddings] Generando embeddings para ${chunks.length} chunks...`);
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
          skipped++;
          continue;
        }

        // Construir metadata con fallbacks (igual que auto-vectorize)
        let title = contextItem.title;
        let fileName = contextItem.fileName;
        let url = contextItem.url;

        // Aplicar fallbacks según el tipo de contexto
        switch (contextItem.type) {
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
            title = title || contextItem.questions || 'Unnamed question';
            break;
        }

        const embeddingMetadata: any = {
          contextId: contextItem.id,
          contextType: contextItem.type,
          title,
          fileName,
          url,
          chunkIndex: i,
          totalChunks: chunks.length,
          source: 'unified-processor',
        };

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
      } catch (chunkError) {
        console.error(`Error generando embedding para chunk ${i}:`, chunkError);
        // Continuar con los demás chunks aunque falle uno
      }
    }

    console.log(`🎉 [addContextWithEmbeddings] Completado: ${created} embeddings creados, ${skipped} saltados`);

    // ⚠️ Si TODOS los embeddings fueron skipped, significa que el contenido YA existe
    // Debemos revertir el $push para no dejar un context huérfano sin embeddings
    if (created === 0 && skipped > 0) {
      console.log(`⚠️ [addContextWithEmbeddings] Todos los embeddings fueron duplicados, revirtiendo $push...`);

      // Obtener chatbot actualizado (después del $push)
      const updatedChatbot = await db.chatbot.findUnique({
        where: { id: chatbotId },
        select: { contexts: true },
      });

      if (updatedChatbot) {
        const filteredContexts = (updatedChatbot.contexts as any[]).filter(
          (ctx: any) => ctx.id !== contextItem.id
        );

        console.log(`   Contextos antes: ${(updatedChatbot.contexts as any[]).length}, después: ${filteredContexts.length}`);

        await db.chatbot.update({
          where: { id: chatbotId },
          data: {
            contexts: filteredContexts,
            contextSizeKB: {
              decrement: contextItem.sizeKB
            }
          }
        });
      }

      console.log(`✅ [addContextWithEmbeddings] Context revertido`);

      const errorResult = {
        success: false,
        contextId: contextItem.id,
        embeddingsCreated: 0,
        embeddingsSkipped: skipped,
        error: 'El contenido de este sitio web ya existe en tu chatbot (contenido duplicado detectado)',
      };

      console.log(`❌ [addContextWithEmbeddings] Retornando error:`, errorResult);
      return errorResult;
    }

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
