/**
 * AgentV0 Endpoint - DEPRECADO
 * TODO: Migrar a Vercel AI SDK
 */

import type { Route } from "./+types/api.agent.v0";

export const action = async ({ request }: Route.ActionArgs): Promise<Response> => {
  // TODO: MIGRAR A VERCEL AI SDK
  // Esta ruta usaba LlamaIndex Agent Workflows que fue eliminado.
  // Usar /chat/vercel/public o /chat/vercel como referencia de implementación.
  return Response.json(
    {
      error: "Esta API está temporalmente fuera de servicio",
      message: "Migración a Vercel AI SDK en progreso. Por favor usa /chat/vercel/public como alternativa.",
      type: "error"
    },
    { status: 503 }
  );
};

// Handle OPTIONS for CORS
export const options = async (): Promise<Response> => {
  return new Response(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization"
    }
  });
};
