/**
 * Health Check Endpoint para Sistema de Chatbot
 * Verifica la disponibilidad y estado de todos los componentes críticos
 */

import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";

// GET /api/health/chatbot
export async function loader(args: LoaderFunctionArgs) {
  const { handleHealthCheckLoader } = await import("./api.health.chatbot.server");
  return handleHealthCheckLoader(args);
}

// POST /api/health/chatbot (para testing específico)
export async function action(args: ActionFunctionArgs) {
  const { handleHealthCheckAction } = await import("./api.health.chatbot.server");
  return handleHealthCheckAction(args);
}