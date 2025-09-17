/**
 * Integration Handler - Maneja todas las operaciones de integraciones
 * Modularización de operaciones de integración desde API v1
 */

export async function handleIntegrationManagement(
  intent: string,
  formData: FormData,
  userId: string
): Promise<Response> {
  // Imports dinámicos para optimización
  const {
    createIntegration,
    getIntegrationsByChatbotId,
    updateIntegration,
    toggleIntegrationStatus,
    deleteIntegration,
    getChatbotById,
  } = await import("../chatbot-api.server");

  try {
    switch (intent) {
      case "create_integration": {
        const chatbotId = formData.get("chatbotId") as string;
        const type = formData.get("type") as string;
        const config = formData.get("config") as string;

        if (!chatbotId || !type) {
          return new Response(
            JSON.stringify({ error: "chatbotId y type son requeridos" }),
            { status: 400, headers: { "Content-Type": "application/json" } }
          );
        }

        // Verificar que el chatbot pertenece al usuario
        const chatbot = await getChatbotById(chatbotId);
        if (!chatbot || chatbot.userId !== userId) {
          return new Response(
            JSON.stringify({ error: "No tienes permiso para modificar este chatbot" }),
            { status: 403, headers: { "Content-Type": "application/json" } }
          );
        }

        const integration = await createIntegration({
          chatbotId,
          type,
          config: config ? JSON.parse(config) : {},
        });

        return new Response(JSON.stringify({ success: true, integration }), {
          headers: { "Content-Type": "application/json" },
        });
      }

      case "get_integrations": {
        const chatbotId = formData.get("chatbotId") as string;

        if (!chatbotId) {
          return new Response(
            JSON.stringify({ error: "chatbotId es requerido" }),
            { status: 400, headers: { "Content-Type": "application/json" } }
          );
        }

        // Verificar que el chatbot pertenece al usuario
        const chatbot = await getChatbotById(chatbotId);
        if (!chatbot || chatbot.userId !== userId) {
          return new Response(
            JSON.stringify({ error: "No tienes permiso para ver este chatbot" }),
            { status: 403, headers: { "Content-Type": "application/json" } }
          );
        }

        const integrations = await getIntegrationsByChatbotId(chatbotId);
        return new Response(JSON.stringify({ success: true, integrations }), {
          headers: { "Content-Type": "application/json" },
        });
      }

      case "update_integration": {
        const integrationId = formData.get("integrationId") as string;
        const config = formData.get("config") as string;

        if (!integrationId) {
          return new Response(
            JSON.stringify({ error: "integrationId es requerido" }),
            { status: 400, headers: { "Content-Type": "application/json" } }
          );
        }

        const integration = await updateIntegration(integrationId, {
          config: config ? JSON.parse(config) : {},
        });

        return new Response(JSON.stringify({ success: true, integration }), {
          headers: { "Content-Type": "application/json" },
        });
      }

      case "toggle_integration_status": {
        const integrationId = formData.get("integrationId") as string;

        if (!integrationId) {
          return new Response(
            JSON.stringify({ error: "integrationId es requerido" }),
            { status: 400, headers: { "Content-Type": "application/json" } }
          );
        }

        const integration = await toggleIntegrationStatus(integrationId);
        return new Response(JSON.stringify({ success: true, integration }), {
          headers: { "Content-Type": "application/json" },
        });
      }

      case "delete_integration": {
        const integrationId = formData.get("integrationId") as string;

        if (!integrationId) {
          return new Response(
            JSON.stringify({ error: "integrationId es requerido" }),
            { status: 400, headers: { "Content-Type": "application/json" } }
          );
        }

        await deleteIntegration(integrationId);
        return new Response(JSON.stringify({ success: true }), {
          headers: { "Content-Type": "application/json" },
        });
      }

      default:
        return new Response(
          JSON.stringify({ error: "Intent de integración no soportado" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
    }
  } catch (error: any) {
    console.error(`❌ Error en ${intent}:`, error);
    return new Response(
      JSON.stringify({
        error: error.message || "Error interno del servidor",
        intent
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}