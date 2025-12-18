/**
 * 🔧 Custom Tools API - CRUD completo con intents
 *
 * POST /api/v1/custom-tools
 *   - intent: "create" - Crear nueva herramienta
 *   - intent: "update" - Actualizar herramienta existente
 *   - intent: "delete" - Eliminar herramienta
 *   - intent: "toggle" - Activar/desactivar herramienta
 *   - intent: "test" - Probar conexión del endpoint
 *
 * GET /api/v1/custom-tools?chatbotId=xxx - Listar herramientas
 */

import { db } from "~/utils/db.server";
import { getUserOrRedirect } from "server/getUserUtils.server";
import { validateChatbotAccess } from "server/chatbot/chatbotAccess.server";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";

// ============================================================================
// LOADER - Listar herramientas
// ============================================================================

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const user = await getUserOrRedirect(request);
    const url = new URL(request.url);
    const chatbotId = url.searchParams.get("chatbotId");

    if (!chatbotId) {
      return Response.json(
        { error: "chatbotId es requerido" },
        { status: 400 }
      );
    }

    const access = await validateChatbotAccess(user.id, chatbotId);
    if (!access.canAccess) {
      return Response.json({ error: "No autorizado" }, { status: 403 });
    }

    const tools = await db.customTool.findMany({
      where: { chatbotId },
      orderBy: { createdAt: "desc" },
    });

    return Response.json({ tools });
  } catch (error) {
    console.error("[Custom Tools] Error listing tools:", error);
    return Response.json(
      { error: "Error al listar herramientas" },
      { status: 500 }
    );
  }
}

// ============================================================================
// ACTION - CRUD con intents
// ============================================================================

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const user = await getUserOrRedirect(request);
    const body = await request.json();
    const { intent, chatbotId } = body;

    if (!chatbotId) {
      return Response.json(
        { error: "chatbotId es requerido" },
        { status: 400 }
      );
    }

    // Validar acceso al chatbot
    const access = await validateChatbotAccess(user.id, chatbotId);
    if (!access.canAccess) {
      return Response.json({ error: "No autorizado" }, { status: 403 });
    }

    switch (intent) {
      case "create":
        return handleCreate(body);

      case "update":
        return handleUpdate(body);

      case "delete":
        return handleDelete(body);

      case "toggle":
        return handleToggle(body);

      case "test":
        return handleTest(body);

      default:
        return Response.json(
          { error: `Intent desconocido: ${intent}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("[Custom Tools] Error:", error);
    return Response.json(
      { error: "Error al procesar solicitud" },
      { status: 500 }
    );
  }
}

// ============================================================================
// HANDLERS
// ============================================================================

async function handleCreate(body: any) {
  const {
    chatbotId,
    name,
    displayName,
    description,
    method,
    url,
    authType,
    authKey,
    authValue,
    headers,
    parametersSchema,
    successMessage,
  } = body;

  // Validar campos requeridos
  if (!name || !displayName || !description || !url) {
    return Response.json(
      { error: "Faltan campos requeridos" },
      { status: 400 }
    );
  }

  // Validar formato snake_case
  if (!/^[a-z][a-z0-9_]*$/.test(name)) {
    return Response.json(
      { error: "El nombre técnico debe ser snake_case" },
      { status: 400 }
    );
  }

  // Validar URL
  try {
    new URL(url);
  } catch {
    return Response.json({ error: "URL inválida" }, { status: 400 });
  }

  // Verificar duplicados
  const existing = await db.customTool.findUnique({
    where: { chatbotId_name: { chatbotId, name } },
  });

  if (existing) {
    return Response.json(
      { error: `Ya existe una herramienta con el nombre "${name}"` },
      { status: 400 }
    );
  }

  const tool = await db.customTool.create({
    data: {
      chatbotId,
      name,
      displayName,
      description,
      method: method || "POST",
      url,
      authType: authType || "none",
      authKey: authKey || null,
      authValue: authValue || null,
      headers: headers || null,
      parametersSchema: parametersSchema || null,
      successMessage: successMessage || null,
      isActive: true,
    },
  });

  console.log(`[Custom Tools] Created: ${name} for chatbot ${chatbotId}`);
  return Response.json({ success: true, tool });
}

async function handleUpdate(body: any) {
  const {
    chatbotId,
    toolId,
    displayName,
    description,
    method,
    url,
    authType,
    authKey,
    authValue,
    headers,
    parametersSchema,
    successMessage,
  } = body;

  if (!toolId) {
    return Response.json({ error: "toolId es requerido" }, { status: 400 });
  }

  // Validar campos requeridos
  if (!displayName || !description || !url) {
    return Response.json(
      { error: "Faltan campos requeridos" },
      { status: 400 }
    );
  }

  // Validar URL
  try {
    new URL(url);
  } catch {
    return Response.json({ error: "URL inválida" }, { status: 400 });
  }

  // Verificar que existe y pertenece al chatbot
  const existing = await db.customTool.findFirst({
    where: { id: toolId, chatbotId },
  });

  if (!existing) {
    return Response.json(
      { error: "Herramienta no encontrada" },
      { status: 404 }
    );
  }

  const tool = await db.customTool.update({
    where: { id: toolId },
    data: {
      displayName,
      description,
      method: method || "POST",
      url,
      authType: authType || "none",
      authKey: authKey || null,
      authValue: authValue || null,
      headers: headers || null,
      parametersSchema: parametersSchema || null,
      successMessage: successMessage || null,
    },
  });

  console.log(`[Custom Tools] Updated: ${existing.name} (${toolId})`);
  return Response.json({ success: true, tool });
}

async function handleDelete(body: any) {
  const { chatbotId, toolId } = body;

  if (!toolId) {
    return Response.json({ error: "toolId es requerido" }, { status: 400 });
  }

  const existing = await db.customTool.findFirst({
    where: { id: toolId, chatbotId },
  });

  if (!existing) {
    return Response.json(
      { error: "Herramienta no encontrada" },
      { status: 404 }
    );
  }

  await db.customTool.delete({ where: { id: toolId } });

  console.log(`[Custom Tools] Deleted: ${existing.name} (${toolId})`);
  return Response.json({ success: true });
}

async function handleToggle(body: any) {
  const { chatbotId, toolId, isActive } = body;

  if (!toolId) {
    return Response.json({ error: "toolId es requerido" }, { status: 400 });
  }

  if (typeof isActive !== "boolean") {
    return Response.json(
      { error: "isActive debe ser booleano" },
      { status: 400 }
    );
  }

  const existing = await db.customTool.findFirst({
    where: { id: toolId, chatbotId },
  });

  if (!existing) {
    return Response.json(
      { error: "Herramienta no encontrada" },
      { status: 404 }
    );
  }

  const tool = await db.customTool.update({
    where: { id: toolId },
    data: { isActive },
  });

  console.log(
    `[Custom Tools] ${isActive ? "Activated" : "Deactivated"}: ${existing.name}`
  );
  return Response.json({ success: true, tool });
}

async function handleTest(body: any) {
  const { chatbotId, toolId } = body;

  if (!toolId) {
    return Response.json({ error: "toolId es requerido" }, { status: 400 });
  }

  const tool = await db.customTool.findFirst({
    where: { id: toolId, chatbotId },
  });

  if (!tool) {
    return Response.json(
      { error: "Herramienta no encontrada" },
      { status: 404 }
    );
  }

  // Build headers
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "User-Agent": "Formmy-CustomTool-Test/1.0",
  };

  if (tool.headers && typeof tool.headers === "object") {
    Object.assign(headers, tool.headers);
  }

  // Add authentication
  if (tool.authType && tool.authType !== "none" && tool.authValue) {
    switch (tool.authType) {
      case "bearer":
        headers["Authorization"] = `Bearer ${tool.authValue}`;
        break;
      case "api_key":
        headers[tool.authKey || "X-API-Key"] = tool.authValue;
        break;
      case "basic":
        headers["Authorization"] = `Basic ${Buffer.from(tool.authValue).toString("base64")}`;
        break;
    }
  }

  // Test request with timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const startTime = Date.now();

    const response = await fetch(tool.url, {
      method: tool.method === "GET" ? "GET" : "POST",
      headers,
      body: tool.method === "POST" ? JSON.stringify({ test: true }) : undefined,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const responseTime = Date.now() - startTime;

    // Update stats
    await db.customTool.update({
      where: { id: toolId },
      data: {
        lastUsedAt: new Date(),
        ...(response.ok
          ? { lastError: null }
          : {
              errorCount: { increment: 1 },
              lastErrorAt: new Date(),
              lastError: `HTTP ${response.status}: ${response.statusText}`,
            }),
      },
    });

    if (response.ok) {
      return Response.json({
        success: true,
        status: `HTTP ${response.status} OK`,
        responseTime: `${responseTime}ms`,
      });
    } else {
      return Response.json(
        {
          error: `HTTP ${response.status}: ${response.statusText}`,
          responseTime: `${responseTime}ms`,
        },
        { status: 400 }
      );
    }
  } catch (fetchError: unknown) {
    clearTimeout(timeoutId);

    const errorMessage =
      fetchError instanceof Error
        ? fetchError.name === "AbortError"
          ? "Timeout: El servidor no respondió en 10 segundos"
          : fetchError.message
        : "Error de conexión";

    await db.customTool.update({
      where: { id: toolId },
      data: {
        errorCount: { increment: 1 },
        lastErrorAt: new Date(),
        lastError: errorMessage,
      },
    });

    return Response.json({ error: errorMessage }, { status: 400 });
  }
}
