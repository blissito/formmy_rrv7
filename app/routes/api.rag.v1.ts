/**
 * RAG API v1 - Query and manage RAG contexts
 *
 * Endpoints:
 * - POST /api/rag/v1?intent=query - Test RAG queries
 * - GET /api/rag/v1?intent=list - List parsed documents with quality scores
 */

import { extractApiKeyFromRequest, authenticateApiKey } from "server/chatbot/apiKeyAuth.server";
import { vectorSearch, vectorSearchWithFilters } from "server/vector/vector-search.service";
import { validateAndDeduct } from "server/llamaparse/credits.service";
import { db } from "~/utils/db.server";
import OpenAI from "openai";

// Cliente OpenAI para LLM synthesis
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * GET - List documents or get stats
 */
export async function loader({ request }: { request: Request }) {
  try {
    // Autenticar con API key
    const apiKey = await extractApiKeyFromRequest(request);
    if (!apiKey) {
      return Response.json(
        { error: "API key required. Use Authorization: Bearer sk_live_xxx or X-API-Key header" },
        { status: 401 }
      );
    }

    const authResult = await authenticateApiKey(apiKey);
    const userId = authResult.apiKey.user.id;

    const url = new URL(request.url);
    const intent = url.searchParams.get("intent");
    const chatbotId = url.searchParams.get("chatbotId");

    // GET /api/rag/v1?intent=cleanup&chatbotId=xxx
    if (intent === "cleanup") {
      if (!chatbotId) {
        return Response.json(
          { error: "chatbotId parameter required" },
          { status: 400 }
        );
      }

      // Verificar ownership del chatbot
      const chatbot = await db.chatbot.findFirst({
        where: { id: chatbotId, userId }
      });

      if (!chatbot) {
        return Response.json(
          { error: "Chatbot not found or unauthorized" },
          { status: 403 }
        );
      }

      // Obtener todos los embeddings del chatbot
      const allEmbeddings = await db.embedding.findMany({
        where: { chatbotId },
        select: { id: true, metadata: true }
      });

      // Obtener todos los contextIds válidos (ContextItems + ParsingJobs)
      const chatbotWithContexts = await db.chatbot.findUnique({
        where: { id: chatbotId },
        select: { contexts: true }
      });

      const parsingJobs = await db.parsingJob.findMany({
        where: { chatbotId, status: "COMPLETED" },
        select: { id: true }
      });

      const validContextIds = new Set([
        ...(chatbotWithContexts?.contexts || []).map((ctx: any) => ctx.id),
        ...parsingJobs.map(job => job.id)
      ]);

      // Identificar embeddings huérfanos (sin contextId válido)
      const orphanedEmbeddings = allEmbeddings.filter((emb: any) => {
        const contextId = emb.metadata?.contextId;
        return contextId && !validContextIds.has(contextId);
      });

      // Eliminar embeddings huérfanos
      let deletedCount = 0;
      if (orphanedEmbeddings.length > 0) {
        const orphanedIds = orphanedEmbeddings.map(emb => emb.id);
        const deleteResult = await db.embedding.deleteMany({
          where: { id: { in: orphanedIds } }
        });
        deletedCount = deleteResult.count;
      }

      return Response.json({
        success: true,
        totalEmbeddings: allEmbeddings.length,
        validContexts: validContextIds.size,
        orphanedFound: orphanedEmbeddings.length,
        orphanedDeleted: deletedCount,
        message: deletedCount > 0
          ? `Limpieza completada: ${deletedCount} embeddings huérfanos eliminados`
          : "No se encontraron embeddings huérfanos"
      });
    }

    // GET /api/rag/v1?intent=list&chatbotId=xxx
    if (intent === "list") {
      if (!chatbotId) {
        return Response.json(
          { error: "chatbotId parameter required" },
          { status: 400 }
        );
      }

      // Verificar ownership del chatbot
      const chatbot = await db.chatbot.findFirst({
        where: { id: chatbotId, userId }
      });

      if (!chatbot) {
        return Response.json(
          { error: "Chatbot not found or unauthorized" },
          { status: 403 }
        );
      }

      // Obtener chatbot con contextos
      const chatbotWithContexts = await db.chatbot.findUnique({
        where: { id: chatbotId },
        select: {
          contexts: true
        }
      });

      // Obtener parsing jobs completados de este chatbot
      const parsingJobs = await db.parsingJob.findMany({
        where: {
          chatbotId,
          status: "COMPLETED"
        },
        select: {
          id: true,
          fileName: true,
          mode: true,
          pages: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" }
      });

      // Obtener todos los embeddings de una vez para eficiencia
      const allEmbeddings = await db.embedding.findMany({
        where: { chatbotId },
        select: { metadata: true }
      });

      // Procesar ParsingJobs (vía Parser API)
      const parsingJobDocs = parsingJobs
        .map((job) => {
          const embeddingCount = allEmbeddings.filter((emb: any) =>
            emb.metadata?.contextId === job.id
          ).length;

          // Solo incluir si tiene embeddings (documento activo)
          if (embeddingCount === 0) return null;

          return {
            id: job.id,
            fileName: job.fileName,
            mode: job.mode,
            pages: job.pages || 0,
            chunks: embeddingCount,
            quality: null,
            queryCount: 0,
            source: "parser_api",
            createdAt: job.createdAt
          };
        })
        .filter(Boolean); // Remover nulos

      // Procesar ContextItems (TODOS los tipos: FILE, LINK, TEXT, QUESTION)
      const contextItemDocs = (chatbotWithContexts?.contexts || [])
        .map((ctx: any) => {
          const embeddingCount = allEmbeddings.filter((emb: any) =>
            emb.metadata?.contextId === ctx.id
          ).length;

          // Solo incluir si tiene embeddings (documento activo)
          if (embeddingCount === 0) return null;

          // Determinar nombre/título según el tipo
          let displayName = "Unnamed";
          let source = "manual_upload";

          switch (ctx.type) {
            case "FILE":
              displayName = ctx.fileName || "Unnamed file";
              source = "manual_upload";
              break;
            case "LINK":
              displayName = ctx.url || ctx.title || "Unnamed link";
              source = "web_source";
              break;
            case "TEXT":
              displayName = ctx.title || "Unnamed text";
              source = "text_context";
              break;
            case "QUESTION":
              displayName = ctx.title || ctx.questions || "Unnamed Q&A";
              source = "qa_context";
              break;
            default:
              displayName = ctx.title || ctx.fileName || "Unknown";
              source = "unknown";
          }

          return {
            id: ctx.id,
            fileName: displayName,
            type: ctx.type, // Agregar tipo para debug
            mode: "COST_EFFECTIVE", // Contextos manuales usan modo básico
            pages: ctx.type === "LINK" ? (ctx.routes?.length || 0) : 0,
            chunks: embeddingCount,
            quality: null,
            queryCount: 0,
            source,
            createdAt: new Date(ctx.createdAt)
          };
        })
        .filter(Boolean); // Remover nulos

      // Combinar ambas fuentes y ordenar por fecha
      const allDocs = [...parsingJobDocs, ...contextItemDocs]
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      return Response.json({
        contexts: allDocs,
        total: allDocs.length
      });
    }

    return Response.json(
      { error: "Invalid intent. Use intent=list or intent=cleanup" },
      { status: 400 }
    );
  } catch (error) {
    console.error("[RAG API] Error in loader:", error);

    if (error instanceof Response) {
      return error;
    }

    return Response.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}

/**
 * POST - Query RAG
 */
export async function action({ request }: { request: Request }) {
  try {
    // Autenticar con API key
    const apiKey = await extractApiKeyFromRequest(request);
    if (!apiKey) {
      return Response.json(
        { error: "API key required. Use Authorization: Bearer sk_live_xxx or X-API-Key header" },
        { status: 401 }
      );
    }

    const authResult = await authenticateApiKey(apiKey);
    const userId = authResult.apiKey.user.id;

    const url = new URL(request.url);
    const intent = url.searchParams.get("intent");

    // POST /api/rag/v1?intent=query
    if (intent === "query") {
      const body = await request.json();
      const { query, chatbotId, contextId, mode = "accurate" } = body;

      // Validaciones
      if (!query || typeof query !== "string") {
        return Response.json(
          { error: "query field required (string)" },
          { status: 400 }
        );
      }

      if (!chatbotId) {
        return Response.json(
          { error: "chatbotId field required" },
          { status: 400 }
        );
      }

      if (!["fast", "accurate"].includes(mode)) {
        return Response.json(
          { error: "Invalid mode. Use: fast or accurate" },
          { status: 400 }
        );
      }

      // Verificar ownership del chatbot
      const chatbot = await db.chatbot.findFirst({
        where: { id: chatbotId, userId }
      });

      if (!chatbot) {
        return Response.json(
          { error: "Chatbot not found or unauthorized" },
          { status: 403 }
        );
      }

      const startTime = Date.now();

      // Realizar búsqueda vectorial
      let results;
      if (contextId) {
        // Búsqueda filtrada por contextId específico
        results = await vectorSearchWithFilters(
          query,
          chatbotId,
          { contextId },
          5
        );
      } else {
        // Búsqueda en todos los contextos del chatbot
        results = await vectorSearch(query, chatbotId, 5);
      }

      const processingTime = Date.now() - startTime;

      // Si no hay resultados
      if (results.length === 0) {
        return Response.json({
          query,
          results: [],
          creditsUsed: 0,
          processingTime
        });
      }

      // Modo "fast": Solo retrieval
      if (mode === "fast") {
        // Validar y descontar 1 crédito
        await validateAndDeduct(userId, 1);

        return Response.json({
          query,
          results: results.map(r => ({
            content: r.content,
            score: r.score,
            metadata: {
              contextType: r.metadata.contextType, // ✅ AGREGADO: Necesario para el emoji
              title: r.metadata.title,             // ✅ AGREGADO: Necesario para el nombre
              fileName: r.metadata.fileName,
              url: r.metadata.url,                 // ✅ AGREGADO: Por completitud
              page: (r.metadata as any).page,
              chunkIndex: r.metadata.chunkIndex,
              contextId: r.metadata.contextId      // ✅ AGREGADO: Por completitud
            }
          })),
          creditsUsed: 1,
          processingTime
        });
      }

      // Modo "accurate": Retrieval + LLM synthesis
      // Preparar contexto para el LLM
      const context = results
        .map((r, i) => `[${i + 1}] ${r.content}`)
        .join("\n\n");

      const systemPrompt = `Eres un asistente útil que responde preguntas basándote ÚNICAMENTE en el contexto proporcionado.

Si la respuesta no está en el contexto, di claramente "No encontré esa información en los documentos disponibles."

Sé conciso y preciso.`;

      const userPrompt = `Contexto de la base de conocimiento:

${context}

---

Pregunta: ${query}

Responde basándote únicamente en el contexto anterior:`;

      // Llamar al LLM
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ]
      });

      const answer = response.choices[0]?.message?.content || "No pude generar una respuesta.";

      // Validar y descontar 2 créditos
      await validateAndDeduct(userId, 2);

      return Response.json({
        query,
        answer,
        sources: results.map(r => ({
          content: r.content,
          score: r.score,
          metadata: {
            contextType: r.metadata.contextType, // ✅ AGREGADO: Necesario para el emoji
            title: r.metadata.title,             // ✅ AGREGADO: Necesario para el nombre
            fileName: r.metadata.fileName,
            url: r.metadata.url,                 // ✅ AGREGADO: Por completitud
            page: (r.metadata as any).page,
            chunkIndex: r.metadata.chunkIndex,
            contextId: r.metadata.contextId      // ✅ AGREGADO: Por completitud
          }
        })),
        creditsUsed: 2,
        processingTime: Date.now() - startTime
      });
    }

    return Response.json(
      { error: "Invalid intent. Use intent=query" },
      { status: 400 }
    );
  } catch (error) {
    console.error("[RAG API] Error in action:", error);

    if (error instanceof Response) {
      return error;
    }

    // Error de créditos insuficientes
    if (error instanceof Error && error.message.includes("Créditos insuficientes")) {
      return Response.json(
        {
          error: "Insufficient credits",
          message: error.message,
        },
        { status: 402 } // Payment Required
      );
    }

    return Response.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
