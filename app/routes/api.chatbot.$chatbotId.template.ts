export async function loader({ request }: any) {
  return new Response(JSON.stringify({ message: "GET not implemented" }), {
    headers: { "Content-Type": "application/json" },
  });
}

export async function action({ request, params }: any) {
  // Solo permitir PATCH
  if (request.method !== "PATCH") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { 
      status: 405,
      headers: { "Content-Type": "application/json" }
    });
  }

  const { chatbotId } = params;

  const { db } = await import("~/utils/db.server");
  const { getSession } = await import("~/sessions");

  try {
    // Verificar autenticación
    const session = await getSession(request.headers.get("Cookie"));
    const userIdOrEmail = session.get("userId");

    if (!userIdOrEmail) {
      return new Response(JSON.stringify({ error: "No autorizado" }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Buscar user real por email o ID
    const isValidObjectId = /^[a-f\d]{24}$/i.test(userIdOrEmail);
    const user = await db.user.findFirst({
      where: isValidObjectId
        ? { id: userIdOrEmail }
        : { email: userIdOrEmail }
    });

    if (!user) {
      return new Response(JSON.stringify({ error: "Usuario no encontrado" }), {
        status: 404,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Verificar que el chatbot pertenece al usuario
    const chatbot = await db.chatbot.findFirst({
      where: {
        id: chatbotId,
        userId: user.id,
      },
    });

    if (!chatbot) {
      return new Response(JSON.stringify({ error: "Chatbot no encontrado" }), {
        status: 404,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Obtener datos del request
    const { widgetTemplate, widgetConfig } = await request.json();

    // Validar template
    const validTemplates = ["bubble", "sidebar", "minimal", "enterprise", "industrial"];
    if (widgetTemplate && !validTemplates.includes(widgetTemplate)) {
      return new Response(JSON.stringify({ error: "Template no válido" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Actualizar chatbot
    const updatedChatbot = await db.chatbot.update({
      where: { id: chatbotId },
      data: {
        ...(widgetTemplate && { widgetTemplate }),
        ...(widgetConfig && { widgetConfig }),
      },
    });

    return new Response(JSON.stringify({ 
      success: true, 
      chatbot: {
        id: updatedChatbot.id,
        widgetTemplate: updatedChatbot.widgetTemplate,
        widgetConfig: updatedChatbot.widgetConfig,
      }
    }), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("Error updating chatbot template:", error);
    return new Response(JSON.stringify({ error: "Error interno del servidor" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}