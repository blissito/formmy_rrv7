import { data as json } from "react-router";
import { db } from "~/utils/db.server";
import { getUserOrRedirect } from "server/getUserUtils.server";
import { validateChatbotAccess } from "server/chatbot/chatbotAccess.server";
import type { Route } from "./+types/api.v1.leads";

/**
 * API para obtener leads de un chatbot
 * - GET: Obtener leads de un chatbot específico
 * - POST: Not allowed
 */

export const loader = async ({ request }: Route.LoaderArgs) => {
  try {
    const user = await getUserOrRedirect(request);
    const url = new URL(request.url);
    const chatbotId = url.searchParams.get("chatbotId");

    if (!chatbotId) {
      return json(
        { error: "chatbotId es requerido" },
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Validar acceso al chatbot
    const accessValidation = await validateChatbotAccess(user.id, chatbotId);
    if (!accessValidation.canAccess) {
      return json(
        { error: "Sin acceso a este chatbot" },
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }

    // Obtener leads del chatbot
    const leads = await db.lead.findMany({
      where: {
        chatbotId: chatbotId,
      },
      orderBy: {
        capturedAt: "desc",
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        productInterest: true,
        position: true,
        website: true,
        notes: true,
        status: true,
        source: true,
        capturedAt: true,
        lastUpdated: true,
        conversationId: true,
        chatbotId: true,
      },
    });

    return json(
      { success: true, leads },
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error fetching leads:", error);
    return json(
      { error: "Error al obtener leads" },
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

export const action = async () => {
  return json(
    { error: "Method Not Allowed. Use GET to fetch leads." },
    { status: 405, headers: { "Content-Type": "application/json" } }
  );
};
