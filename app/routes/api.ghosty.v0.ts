/**
 * Ghosty v0 Endpoint - DEPRECADO
 * TODO: Migrar a Vercel AI SDK
 */

import type { Route } from "./+types/api.ghosty.v0";
import { getUserOrNull } from "server/getUserUtils.server";

export const action = async ({ request }: Route.ActionArgs): Promise<Response> => {
  // TODO: MIGRAR A VERCEL AI SDK
  // Esta ruta usaba LlamaIndex Agent Workflows que fue eliminado.
  // Usar /chat/vercel como referencia de implementación (tiene tools de Ghosty).
  // Ver: app/routes/chat.vercel.tsx

  try {
    // Autenticación básica para devolver error amigable
    const user = await getUserOrNull(request);
    if (!user) {
      return Response.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    return Response.json(
      {
        error: "Ghosty v0 está temporalmente fuera de servicio",
        message: "Migración a Vercel AI SDK en progreso. Ghosty volverá pronto con mejoras.",
        type: "error"
      },
      { status: 503 }
    );

  } catch (error) {
    console.error("❌ Ghosty v0 endpoint error:", error);
    return Response.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
};
