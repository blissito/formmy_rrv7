import { data as json } from "react-router";
import { db } from "~/utils/db.server";
import { getUserOrRedirect } from "server/getUserUtils.server";
import { validateChatbotAccess } from "server/chatbot/chatbotAccess.server";

/**
 * API para obtener mensajes de una conversación con paginación
 * - GET: Obtener mensajes con soporte de cursor-based pagination (FASE 2)
 *   Query params:
 *     - limit: Número de mensajes a cargar (default 50)
 *     - before: Message ID del mensaje más antiguo cargado (para cargar histórico)
 * - POST: Not allowed
 */

export const loader = async ({ request, params }: any) => {
  try {
    const user = await getUserOrRedirect(request);
    const { conversationId } = params;
    const url = new URL(request.url);

    // Query params para paginación
    const limit = parseInt(url.searchParams.get("limit") || "50");
    const beforeCursor = url.searchParams.get("before"); // Message ID

    if (!conversationId) {
      return json(
        { error: "conversationId es requerido" },
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Obtener conversación y validar acceso
    const conversation = await db.conversation.findUnique({
      where: { id: conversationId },
      select: { id: true, chatbotId: true },
    });

    if (!conversation) {
      return json(
        { error: "Conversación no encontrada" },
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // Validar acceso al chatbot
    if (conversation.chatbotId) {
      const accessValidation = await validateChatbotAccess(
        user.id,
        conversation.chatbotId
      );
      if (!accessValidation.canAccess) {
        return json(
          { error: "Sin acceso a esta conversación" },
          { status: 403, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    // ⚡ FASE 2: Paginación con cursor - Obtener mensajes más recientes primero
    // Si NO hay cursor "before", retornar los últimos N mensajes (más recientes)
    // Si HAY cursor "before", retornar N mensajes ANTES del cursor (histórico)
    const messages = await db.message.findMany({
      where: {
        conversationId: conversationId,
        deleted: { not: true },
        ...(beforeCursor
          ? {
              createdAt: {
                lt: await db.message
                  .findUnique({
                    where: { id: beforeCursor },
                    select: { createdAt: true },
                  })
                  .then((msg) => msg?.createdAt || new Date()),
              },
            }
          : {}),
      },
      orderBy: {
        createdAt: "desc", // Orden descendente para obtener los más recientes
      },
      take: limit + 1, // Cargar uno extra para saber si hay más
    });

    // Determinar si hay más mensajes
    const hasMore = messages.length > limit;
    const messagesToReturn = hasMore
      ? messages.slice(0, limit)
      : messages;

    // Invertir orden para que aparezcan cronológicamente (asc) en el cliente
    const sortedMessages = messagesToReturn.reverse();

    // Obtener total de mensajes (útil para el cliente)
    const total = await db.message.count({
      where: {
        conversationId: conversationId,
        deleted: { not: true },
      },
    });

    return json(
      {
        success: true,
        messages: sortedMessages,
        hasMore,
        total,
        nextCursor: hasMore ? messagesToReturn[0].id : null, // El mensaje más antiguo del batch
      },
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "private, max-age=30", // Cache 30s
        },
      }
    );
  } catch (error) {
    console.error("Error fetching conversation messages:", error);
    return json(
      { error: "Error al obtener mensajes" },
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

export const action = async () => {
  return json(
    { error: "Method Not Allowed. Use GET to fetch messages." },
    { status: 405, headers: { "Content-Type": "application/json" } }
  );
};
