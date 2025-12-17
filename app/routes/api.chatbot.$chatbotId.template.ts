import type { Route } from "./+types/api.chatbot.$chatbotId.template";
import { json } from "react-router";
import { db } from "~/utils/db.server";
import { getSession } from "~/sessions";

export async function action({ request, params }: Route.ActionArgs) {
  // Solo permitir PATCH
  if (request.method !== "PATCH") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  const { chatbotId } = params;

  try {
    // Verificar autenticación
    const session = await getSession(request.headers.get("Cookie"));
    const userIdOrEmail = session.get("userId");

    if (!userIdOrEmail) {
      return json({ error: "No autorizado" }, { status: 401 });
    }

    // Buscar user real por email o ID
    const isValidObjectId = /^[a-f\d]{24}$/i.test(userIdOrEmail);
    const user = await db.user.findFirst({
      where: isValidObjectId
        ? { id: userIdOrEmail }
        : { email: userIdOrEmail }
    });

    if (!user) {
      return json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    // Verificar que el chatbot pertenece al usuario
    const chatbot = await db.chatbot.findFirst({
      where: {
        id: chatbotId,
        userId: user.id,
      },
    });

    if (!chatbot) {
      return json({ error: "Chatbot no encontrado" }, { status: 404 });
    }

    // Obtener datos del request
    const { widgetTemplate, widgetConfig } = await request.json();

    // Validar template
    const validTemplates = ["bubble", "sidebar", "minimal", "enterprise", "industrial"];
    if (widgetTemplate && !validTemplates.includes(widgetTemplate)) {
      return json({ error: "Template no válido" }, { status: 400 });
    }

    // Actualizar chatbot
    const updatedChatbot = await db.chatbot.update({
      where: { id: chatbotId },
      data: {
        ...(widgetTemplate && { widgetTemplate }),
        ...(widgetConfig && { widgetConfig }),
      },
    });

    return json({ 
      success: true, 
      chatbot: {
        id: updatedChatbot.id,
        widgetTemplate: updatedChatbot.widgetTemplate,
        widgetConfig: updatedChatbot.widgetConfig,
      }
    });

  } catch (error) {
    console.error("Error updating chatbot template:", error);
    return json({ error: "Error interno del servidor" }, { status: 500 });
  }
}