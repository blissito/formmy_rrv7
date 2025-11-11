/**
 * Health Check Endpoint para Sistema de Chatbot
 * Verifica la disponibilidad y estado de todos los componentes críticos
 */


// GET /api/health/chatbot
export async function loader(args: Route.LoaderArgs) {
  const { handleHealthCheckLoader } = await import("./api.health.chatbot.server");
  return handleHealthCheckLoader(args);
}

// POST /api/health/chatbot (para testing específico)
export async function action(args: Route.ActionArgs) {
  const { handleHealthCheckAction } = await import("./api.health.chatbot.server");
  return handleHealthCheckAction(args);
}