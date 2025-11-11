/**
 * API para consultar y reintentar sincronización de WhatsApp Coexistence
 * GET  /api/v1/integrations/whatsapp/sync?integrationId=xxx
 * POST /api/v1/integrations/whatsapp/sync (retry)
 */

import { WhatsAppSyncService } from "server/integrations/whatsapp/sync.service.server";
import { getSession } from "~/sessions";
import { db } from "~/utils/db.server";

/**
 * GET - Obtener estado de sincronización
 */
export async function loader({ request }: Route.LoaderArgs) {
  try {
    // Autenticar usuario
    const session = await getSession(request.headers.get("Cookie"));
    const userIdOrEmail = session.get("userId");

    if (!userIdOrEmail) {
      return new Response(JSON.stringify({ error: "No autenticado" }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Obtener integrationId de query params
    const url = new URL(request.url);
    const integrationId = url.searchParams.get("integrationId");

    if (!integrationId) {
      return new Response(JSON.stringify({ error: "integrationId requerido" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Verificar que la integración pertenece al usuario
    const integration = await db.integration.findUnique({
      where: { id: integrationId },
      include: { chatbot: true },
    });

    if (!integration) {
      return new Response(JSON.stringify({ error: "Integración no encontrada" }), {
        status: 404,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Obtener userId del usuario autenticado
    const isValidObjectId = /^[a-f\d]{24}$/i.test(userIdOrEmail);
    const user = await db.user.findFirst({
      where: isValidObjectId ? { id: userIdOrEmail } : { email: userIdOrEmail },
    });

    if (!user || integration.chatbot.userId !== user.id) {
      return new Response(JSON.stringify({ error: "No autorizado" }), {
        status: 403,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Obtener estado de sincronización
    const syncStatus = await WhatsAppSyncService.getSyncStatus(integrationId);

    return new Response(JSON.stringify({
      integrationId,
      syncStatus: syncStatus?.syncStatus || null,
      syncAttempts: syncStatus?.syncAttempts || 0,
      syncError: syncStatus?.syncError || null,
      syncCompletedAt: syncStatus?.syncCompletedAt?.toISOString() || null,
    }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("[WhatsApp Sync API] Error:", error);
    return new Response(JSON.stringify({ error: "Error al obtener estado de sincronización" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}

/**
 * POST - Reintentar sincronización
 */
export async function action({ request }: Route.ActionArgs) {
  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" }
    });
  }

  try {
    // Autenticar usuario
    const session = await getSession(request.headers.get("Cookie"));
    const userIdOrEmail = session.get("userId");

    if (!userIdOrEmail) {
      return new Response(JSON.stringify({ error: "No autenticado" }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Obtener integrationId del body
    const body = await request.json();
    const { integrationId } = body;

    if (!integrationId) {
      return new Response(JSON.stringify({ error: "integrationId requerido" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Verificar que la integración pertenece al usuario
    const integration = await db.integration.findUnique({
      where: { id: integrationId },
      include: { chatbot: true },
    });

    if (!integration) {
      return new Response(JSON.stringify({ error: "Integración no encontrada" }), {
        status: 404,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Obtener userId del usuario autenticado
    const isValidObjectId = /^[a-f\d]{24}$/i.test(userIdOrEmail);
    const user = await db.user.findFirst({
      where: isValidObjectId ? { id: userIdOrEmail } : { email: userIdOrEmail },
    });

    if (!user || integration.chatbot.userId !== user.id) {
      return new Response(JSON.stringify({ error: "No autorizado" }), {
        status: 403,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Reintentar sincronización
    const result = await WhatsAppSyncService.retrySync(integrationId);

    if (!result.success) {
      return new Response(JSON.stringify({ error: result.error || "Error al reintentar sincronización" }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }

    return new Response(JSON.stringify({
      success: true,
      message: "Sincronización iniciada. Los webhooks llegarán automáticamente.",
    }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("[WhatsApp Sync API] Error:", error);
    return new Response(JSON.stringify({ error: "Error al reintentar sincronización" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
