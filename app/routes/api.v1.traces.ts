/**
 * API v1 - Traces & Observability
 *
 * Endpoints para consultar traces, spans y métricas de observabilidad.
 * Soporta tanto acceso desde dashboard como desde API externa con API keys.
 *
 * Endpoints:
 * - GET ?intent=list - Listar traces
 * - GET ?intent=get&traceId=xxx - Obtener trace completo
 * - GET ?intent=stats - Estadísticas agregadas
 * - GET ?intent=export&traceId=xxx&format=otel - Exportar a OpenTelemetry
 */

import type { Route } from "./+types/api.v1.traces";
import { getUserOrRedirect } from "server/getUserUtils.server";
import {
  getTraceById,
  listTraces,
  getTraceStats,
} from "server/tracing/trace.service";

// ============================================================================
// LOADER (GET REQUESTS)
// ============================================================================

export const loader = async ({ request }: Route.LoaderArgs) => {
  const user = await getUserOrRedirect(request);
  const url = new URL(request.url);
  const intent = url.searchParams.get("intent");


  try {
    switch (intent) {
      case "list": {
        const chatbotId = url.searchParams.get("chatbotId") || undefined;
        const limit = parseInt(url.searchParams.get("limit") || "50");
        const offset = parseInt(url.searchParams.get("offset") || "0");

        const result = await listTraces({
          userId: user.id,
          chatbotId,
          limit,
          offset,
        });

        return Response.json({
          success: true,
          traces: result.traces.map((trace) => ({
            id: trace.id,
            chatbotId: trace.chatbotId,
            chatbot: trace.chatbot ? {
              id: trace.chatbot.id,
              name: trace.chatbot.name,
              slug: trace.chatbot.slug,
            } : null,
            conversationId: trace.conversationId,
            metadata: trace.metadata, // Para sessionId de Langfuse
            input: trace.input,
            output: trace.output,
            status: trace.status,
            model: trace.model, // 🔍 Modelo usado
            startTime: trace.startTime,
            endTime: trace.endTime,
            durationMs: trace.durationMs,
            totalTokens: trace.totalTokens,
            totalCost: trace.totalCost,
            creditsUsed: trace.creditsUsed,
            createdAt: trace.createdAt,
            spans: trace.spans.map((span) => ({
              id: span.id,
              type: span.type,
              name: span.name,
              durationMs: span.durationMs,
              tokens: span.tokens,
              cost: span.cost,
              credits: span.credits,
              status: span.status,
            })),
          })),
          total: result.total,
          limit,
          offset,
        });
      }

      case "get": {
        const traceId = url.searchParams.get("traceId");
        if (!traceId) {
          return Response.json(
            { success: false, error: "traceId requerido" },
            { status: 400 }
          );
        }

        // 🔒 getTraceById ahora valida userId internamente
        const trace = await getTraceById(traceId, user.id);

        if (!trace) {
          return Response.json(
            { success: false, error: "Trace no encontrado o no autorizado" },
            { status: 404 }
          );
        }

        return Response.json({
          success: true,
          trace: {
            id: trace.id,
            chatbotId: trace.chatbotId,
            chatbotName: trace.chatbot?.name || null,
            conversationId: trace.conversationId,
            input: trace.input,
            output: trace.output,
            status: trace.status,
            startTime: trace.startTime,
            endTime: trace.endTime,
            durationMs: trace.durationMs,
            totalTokens: trace.totalTokens,
            totalCost: trace.totalCost,
            creditsUsed: trace.creditsUsed,
            metadata: trace.metadata,
            createdAt: trace.createdAt,
            spans: trace.spans.map((span) => ({
              id: span.id,
              type: span.type,
              name: span.name,
              startTime: span.startTime,
              endTime: span.endTime,
              durationMs: span.durationMs,
              input: span.input,
              output: span.output,
              tokens: span.tokens,
              cost: span.cost,
              credits: span.credits,
              status: span.status,
              error: span.error,
              metadata: span.metadata,
            })),
            events: trace.events.map((event) => ({
              id: event.id,
              type: event.type,
              name: event.name,
              data: event.data,
              timestamp: event.timestamp,
            })),
          },
        });
      }

      case "stats": {
        const chatbotId = url.searchParams.get("chatbotId") || undefined;
        const periodDays = parseInt(url.searchParams.get("period") || "7");

        const stats = await getTraceStats({
          userId: user.id,
          chatbotId,
          periodDays,
        });

        return Response.json({
          success: true,
          stats,
        });
      }

      case "export": {
        const traceId = url.searchParams.get("traceId");
        const format = url.searchParams.get("format") || "json";

        if (!traceId) {
          return Response.json(
            { success: false, error: "traceId requerido" },
            { status: 400 }
          );
        }

        // 🔒 getTraceById ahora valida userId internamente
        const trace = await getTraceById(traceId, user.id);

        if (!trace) {
          return Response.json(
            { success: false, error: "Trace no encontrado o no autorizado" },
            { status: 404 }
          );
        }

        if (format === "otel") {
          // TODO: Implementar exportación OpenTelemetry
          // Por ahora retornar JSON simple
          return Response.json({
            success: true,
            message: "OpenTelemetry export coming soon",
            trace,
          });
        }

        // Default: JSON simple
        return Response.json({
          success: true,
          trace,
        });
      }

      default:
        return Response.json(
          { success: false, error: "Intent no reconocido" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("[Traces API] Error:", error);
    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Error interno",
      },
      { status: 500 }
    );
  }
};
