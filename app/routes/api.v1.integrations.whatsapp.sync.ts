/**
 * API para consultar y reintentar sincronización de WhatsApp Coexistence
 * GET  /api/v1/integrations/whatsapp/sync?integrationId=xxx
 * POST /api/v1/integrations/whatsapp/sync (retry)
 */

import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { WhatsAppSyncService } from "server/integrations/whatsapp/sync.service";
import { getSession } from "~/sessions";
import { db } from "~/utils/db.server";

/**
 * GET - Obtener estado de sincronización
 */
export async function loader({ request }: LoaderFunctionArgs) {
  try {
    // Autenticar usuario
    const session = await getSession(request.headers.get("Cookie"));
    const userIdOrEmail = session.get("userId");

    if (!userIdOrEmail) {
      return Response.json({ error: "No autenticado" }, { status: 401 });
    }

    // Obtener integrationId de query params
    const url = new URL(request.url);
    const integrationId = url.searchParams.get("integrationId");

    if (!integrationId) {
      return Response.json({ error: "integrationId requerido" }, { status: 400 });
    }

    // Verificar que la integración pertenece al usuario
    const integration = await db.integration.findUnique({
      where: { id: integrationId },
      include: { chatbot: true },
    });

    if (!integration) {
      return Response.json({ error: "Integración no encontrada" }, { status: 404 });
    }

    // Obtener userId del usuario autenticado
    const isValidObjectId = /^[a-f\d]{24}$/i.test(userIdOrEmail);
    const user = await db.user.findFirst({
      where: isValidObjectId ? { id: userIdOrEmail } : { email: userIdOrEmail },
    });

    if (!user || integration.chatbot.userId !== user.id) {
      return Response.json({ error: "No autorizado" }, { status: 403 });
    }

    // Obtener estado de sincronización
    const syncStatus = await WhatsAppSyncService.getSyncStatus(integrationId);

    return Response.json({
      integrationId,
      syncStatus: syncStatus?.syncStatus || null,
      syncAttempts: syncStatus?.syncAttempts || 0,
      syncError: syncStatus?.syncError || null,
      syncCompletedAt: syncStatus?.syncCompletedAt || null,
    });
  } catch (error) {
    console.error("[WhatsApp Sync API] Error:", error);
    return Response.json(
      { error: "Error al obtener estado de sincronización" },
      { status: 500 }
    );
  }
}

/**
 * POST - Reintentar sincronización
 */
export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    // Autenticar usuario
    const session = await getSession(request.headers.get("Cookie"));
    const userIdOrEmail = session.get("userId");

    if (!userIdOrEmail) {
      return Response.json({ error: "No autenticado" }, { status: 401 });
    }

    // Obtener integrationId del body
    const body = await request.json();
    const { integrationId } = body;

    if (!integrationId) {
      return Response.json({ error: "integrationId requerido" }, { status: 400 });
    }

    // Verificar que la integración pertenece al usuario
    const integration = await db.integration.findUnique({
      where: { id: integrationId },
      include: { chatbot: true },
    });

    if (!integration) {
      return Response.json({ error: "Integración no encontrada" }, { status: 404 });
    }

    // Obtener userId del usuario autenticado
    const isValidObjectId = /^[a-f\d]{24}$/i.test(userIdOrEmail);
    const user = await db.user.findFirst({
      where: isValidObjectId ? { id: userIdOrEmail } : { email: userIdOrEmail },
    });

    if (!user || integration.chatbot.userId !== user.id) {
      return Response.json({ error: "No autorizado" }, { status: 403 });
    }

    // Reintentar sincronización
    const result = await WhatsAppSyncService.retrySync(integrationId);

    if (!result.success) {
      return Response.json(
        { error: result.error || "Error al reintentar sincronización" },
        { status: 500 }
      );
    }

    return Response.json({
      success: true,
      message: "Sincronización iniciada. Los webhooks llegarán automáticamente.",
    });
  } catch (error) {
    console.error("[WhatsApp Sync API] Error:", error);
    return Response.json(
      { error: "Error al reintentar sincronización" },
      { status: 500 }
    );
  }
}
