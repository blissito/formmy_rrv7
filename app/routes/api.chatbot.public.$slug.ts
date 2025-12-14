import { db } from "~/utils/db.server";
import { validateDomainAccess } from "@/server/utils/domain-validator.server";
import {
  getRequestOrigin,
  createCorsHeaders,
} from "@/server/utils/request-origin.server";

/**
 * Handler para CORS preflight requests (OPTIONS)
 */
export async function action({ params, request }: { params: { slug: string }; request: Request }) {
  if (request.method === "OPTIONS") {
    // Para preflight, necesitamos cargar el chatbot para saber los dominios permitidos
    const { slug } = params;
    const chatbot = await db.chatbot.findFirst({
      where: { slug },
      select: { settings: true },
    });

    const allowedDomains = chatbot?.settings?.security?.allowedDomains || [];
    const origin = getRequestOrigin(request);

    // Si no hay restricciones, permitir todo
    if (allowedDomains.length === 0) {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
          "Access-Control-Max-Age": "86400",
        },
      });
    }

    // Validar dominio para preflight
    const validation = validateDomainAccess(origin, allowedDomains);
    return new Response(null, {
      status: 204,
      headers: {
        ...createCorsHeaders(origin, allowedDomains, validation.allowed),
        "Access-Control-Max-Age": "86400",
      },
    });
  }

  return Response.json({ error: "Method not allowed" }, { status: 405 });
}

/**
 * Endpoint público para obtener info básica del chatbot (para el widget).
 * Valida que el dominio de origen esté en la lista de permitidos.
 */
export async function loader({
  params,
  request,
}: {
  params: { slug: string };
  request: Request;
}) {
  try {
    const { slug } = params;

    if (!slug) {
      return Response.json({ error: "Slug requerido" }, { status: 400 });
    }

    const chatbot = await db.chatbot.findFirst({
      where: { slug },
      select: {
        id: true,
        name: true,
        slug: true,
        primaryColor: true,
        avatarUrl: true,
        welcomeMessage: true,
        settings: true, // Para obtener allowedDomains
      },
    });

    if (!chatbot) {
      return Response.json({ error: "Chatbot no encontrado" }, { status: 404 });
    }

    // 🔒 VALIDACIÓN DE DOMINIO
    const allowedDomains = chatbot.settings?.security?.allowedDomains || [];
    const origin = getRequestOrigin(request);
    const validation = validateDomainAccess(origin, allowedDomains);

    if (!validation.allowed) {
      console.warn(
        `[Domain Validation] ❌ Blocked: ${origin || "no-origin"} -> ${slug}`,
        validation.reason
      );
      return Response.json(
        {
          error: "Dominio no autorizado",
          detail: "Este chatbot solo puede ser usado desde dominios autorizados.",
        },
        {
          status: 403,
          headers: createCorsHeaders(origin, allowedDomains, false),
        }
      );
    }

    // ✅ Dominio permitido - retornar metadata (sin settings por seguridad)
    const { settings, ...publicChatbot } = chatbot;

    return Response.json(
      { chatbot: publicChatbot },
      {
        headers: {
          ...createCorsHeaders(origin, allowedDomains, true),
          "Cache-Control": "public, max-age=60",
        },
      }
    );
  } catch (error) {
    console.error("Error al cargar chatbot público:", error);
    return Response.json({ error: "Error interno" }, { status: 500 });
  }
}
