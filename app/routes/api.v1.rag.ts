/**
 * RAG API v1 - External REST API
 *
 * Endpoints:
 * - GET /api/v1/rag?intent=list - Listar contextos del chatbot
 * - POST /api/v1/rag?intent=upload - Subir contexto manualmente
 * - POST /api/v1/rag?intent=query - Consultar RAG con streaming
 */

import type { Route } from "./+types/api.v1.rag";
import { extractApiKeyFromRequest, authenticateApiKey, checkRateLimit } from "../../server/chatbot/apiKeyAuth.server";
import { secureUpsert } from "../../server/context/vercel_embeddings.secure";
import { vectorSearch } from "../../server/vector/vector-search.service";
import { db } from "~/utils/db.server";
import type { ContextType } from "@prisma/client";
import { deductToolCredits } from "../../server/llamaparse/credits.service";

/**
 * Costos de créditos por operación
 */
const CREDIT_COSTS = {
  query: 2,       // 2 créditos por consulta RAG
  upload: 3,      // 3 créditos por subir contexto
  list: 0,        // Listar es gratis
};

/**
 * GET - Listar contextos o consultar RAG
 */
export async function loader({ request }: Route.LoaderArgs) {
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
    const chatbotId = authResult.apiKey.chatbotId;

    // Check rate limit
    const rateLimitResult = await checkRateLimit(authResult.apiKey);
    if (!rateLimitResult.isWithinLimit) {
      return Response.json(
        {
          error: "Rate limit exceeded",
          message: `Rate limit of ${authResult.apiKey.rateLimit} requests per hour exceeded. Try again later.`,
          retryAfter: rateLimitResult.nextAvailableTime?.toISOString(),
        },
        {
          status: 429,
          headers: {
            "Retry-After": rateLimitResult.nextAvailableTime
              ? Math.ceil((rateLimitResult.nextAvailableTime.getTime() - Date.now()) / 1000).toString()
              : "3600",
          },
        }
      );
    }

    const url = new URL(request.url);
    const intent = url.searchParams.get("intent");

    // GET /api/v1/rag?intent=list
    if (intent === "list") {
      const chatbot = await db.chatbot.findUnique({
        where: { id: chatbotId },
        select: {
          id: true,
          name: true,
          contextObjects: true,
          contextSizeKB: true,
          userId: true, // Para validar ownership
          status: true, // Para verificar que está activo
        },
      });

      if (!chatbot) {
        return Response.json(
          { error: "Chatbot not found" },
          { status: 404 }
        );
      }

      // Validar ownership (defensa en profundidad)
      if (chatbot.userId !== userId) {
        return Response.json(
          { error: "Access denied to this chatbot" },
          { status: 403 }
        );
      }

      // Validar que el chatbot está activo
      if (chatbot.status !== "ACTIVE") {
        return Response.json(
          { error: "Chatbot is not active" },
          { status: 403 }
        );
      }

      // Obtener stats de embeddings
      const embeddingCount = await db.embedding.count({
        where: { chatbotId }
      });

      // Log successful list request

      return Response.json({
        chatbotId: chatbot.id,
        chatbotName: chatbot.name,
        totalContexts: chatbot.contextObjects?.length || 0,
        totalSizeKB: chatbot.contextSizeKB || 0,
        totalEmbeddings: embeddingCount,
        contexts: (chatbot.contextObjects || []).map((ctx: any) => ({
          id: ctx.id,
          type: ctx.contextType,
          fileName: ctx.metadata?.fileName,
          title: ctx.title,
          url: ctx.metadata?.url,
          sizeKB: ctx.metadata?.sizeKB,
          createdAt: ctx.createdAt,
          // Parser metadata si existe
          ...(ctx.metadata?.parsingMode && {
            parsingMode: ctx.metadata.parsingMode,
            parsingPages: ctx.metadata.parsingPages,
            parsingCredits: ctx.metadata.parsingCredits,
          }),
        })),
      });
    }

    return Response.json(
      { error: "Invalid intent. Use intent=list" },
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
 * POST - Upload contexto o query RAG
 */
export async function action({ request }: Route.ActionArgs) {
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
    const chatbotId = authResult.apiKey.chatbotId;

    // Check rate limit (para action también)
    const rateLimitResult = await checkRateLimit(authResult.apiKey);
    if (!rateLimitResult.isWithinLimit) {
      return Response.json(
        {
          error: "Rate limit exceeded",
          message: `Rate limit of ${authResult.apiKey.rateLimit} requests per hour exceeded. Try again later.`,
          retryAfter: rateLimitResult.nextAvailableTime?.toISOString(),
        },
        {
          status: 429,
          headers: {
            "Retry-After": rateLimitResult.nextAvailableTime
              ? Math.ceil((rateLimitResult.nextAvailableTime.getTime() - Date.now()) / 1000).toString()
              : "3600",
          },
        }
      );
    }

    const url = new URL(request.url);
    const intent = url.searchParams.get("intent");

    // POST /api/v1/rag?intent=upload
    if (intent === "upload") {
      let body: any;
      try {
        body = await request.json();
      } catch (error) {
        return Response.json(
          { error: "Invalid JSON in request body" },
          { status: 400 }
        );
      }

      const { content, type, metadata = {} } = body;

      // Validaciones
      if (!content || typeof content !== "string") {
        return Response.json(
          { error: "content field required (string)" },
          { status: 400 }
        );
      }

      // Validar contenido no vacío
      if (content.trim().length === 0) {
        return Response.json(
          { error: "content cannot be empty" },
          { status: 400 }
        );
      }

      if (!type || !["TEXT", "FILE", "LINK", "QUESTION"].includes(type)) {
        return Response.json(
          { error: "type field required. Valid values: TEXT, FILE, LINK, QUESTION" },
          { status: 400 }
        );
      }

      // Validar tamaño (5MB max para texto manual)
      const MAX_CONTENT_SIZE = 5 * 1024 * 1024; // 5MB
      if (Buffer.byteLength(content, 'utf8') > MAX_CONTENT_SIZE) {
        return Response.json(
          { error: "Content too large. Maximum size: 5MB" },
          { status: 400 }
        );
      }

      // Validar y sanitizar metadata
      const allowedMetadataFields = ['fileName', 'fileType', 'fileSize', 'url', 'title', 'questions', 'answer', 'routes'];
      const sanitizedMetadata: Record<string, any> = {};
      const MAX_STRING_LENGTH = 500; // 500 chars max por campo

      for (const [key, value] of Object.entries(metadata)) {
        if (allowedMetadataFields.includes(key)) {
          // Validar tipos específicos
          if (key === 'fileSize' && typeof value !== 'number') continue;
          if (key === 'routes' && !Array.isArray(value)) continue;

          // Validar longitud de strings
          if (typeof value === 'string' && value.length > MAX_STRING_LENGTH) {
            continue; // Skip campos muy largos
          }

          sanitizedMetadata[key] = value;
        }
      }

      // Validar y descontar créditos ANTES de procesar
      await deductToolCredits({
        userId,
        chatbotId,
        toolName: "rag_upload",
        credits: CREDIT_COSTS.upload,
      });

      // ✅ Usar Vercel AI SDK para vectorización automática (con validación de ownership)
      const result = await secureUpsert({
        chatbotId,
        userId,
        title: metadata.title || metadata.fileName || 'Untitled',
        content,
        metadata: {
          contextType: type as ContextType,
          ...sanitizedMetadata,
        },
      });

      if (!result.success) {
        // TODO: Implementar rollback de créditos en caso de error
        console.error('[RAG API] Upload failed after credits deducted:', result.error);
        return Response.json(
          { error: result.error || "Failed to add context" },
          { status: 500 }
        );
      }

      // Log successful upload

      return Response.json({
        success: true,
        contextId: result.contextId,
        embeddingsCreated: result.embeddingsCreated,
        embeddingsSkipped: result.embeddingsSkipped,
        creditsUsed: CREDIT_COSTS.upload,
      }, { status: 201 });
    }

    // POST /api/v1/rag?intent=query
    if (intent === "query") {
      let body: any;
      try {
        body = await request.json();
      } catch (error) {
        return Response.json(
          { error: "Invalid JSON in request body" },
          { status: 400 }
        );
      }

      const { query, topK = 5, stream = false } = body;

      // Validaciones
      if (!query || typeof query !== "string") {
        return Response.json(
          { error: "query field required (string)" },
          { status: 400 }
        );
      }

      // Validar query no vacía
      const trimmedQuery = query.trim();
      if (trimmedQuery.length === 0) {
        return Response.json(
          { error: "query cannot be empty" },
          { status: 400 }
        );
      }

      // Validar longitud máxima de query (10KB)
      const MAX_QUERY_LENGTH = 10 * 1024;
      if (Buffer.byteLength(trimmedQuery, 'utf8') > MAX_QUERY_LENGTH) {
        return Response.json(
          { error: "Query too long. Maximum size: 10KB" },
          { status: 400 }
        );
      }

      // Validar topK
      if (typeof topK !== 'number' || !Number.isInteger(topK)) {
        return Response.json(
          { error: "topK must be an integer" },
          { status: 400 }
        );
      }
      const limit = Math.min(Math.max(1, topK), 20); // Entre 1 y 20

      // Validar y descontar créditos
      await deductToolCredits({
        userId,
        chatbotId,
        toolName: "rag_query",
        credits: CREDIT_COSTS.query,
      });

      // Realizar búsqueda vectorial
      const results = await vectorSearch(trimmedQuery, chatbotId, limit);

      // Si no hay resultados
      if (results.length === 0) {
        return Response.json({
          query: trimmedQuery,
          answer: "No se encontró información relevante en la base de conocimientos.",
          sources: [],
          creditsUsed: CREDIT_COSTS.query,
        });
      }

      // Construir respuesta con fuentes
      const sources = results.map((r) => ({
        content: r.content,
        score: r.score,
        metadata: {
          fileName: r.metadata.fileName,
          title: r.metadata.title,
          url: r.metadata.url,
          contextType: r.metadata.contextType,
        },
      }));

      // Generar respuesta simple concatenando los top resultados
      const topResults = results.slice(0, 3);
      const answer = topResults
        .map((r, idx) => {
          const source = r.metadata.fileName || r.metadata.title || r.metadata.url || "Unknown";
          return `[${idx + 1}] ${source}:\n${r.content}`;
        })
        .join("\n\n");

      // Log successful query

      return Response.json({
        query: trimmedQuery,
        answer,
        sources,
        creditsUsed: CREDIT_COSTS.query,
      });
    }

    return Response.json(
      { error: "Invalid intent. Use intent=upload or intent=query" },
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
