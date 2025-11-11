/**
 * API Chatbot V0 - Endpoint específico para AgentEngine_v0
 * Solo maneja chat, no CRUD
 */


export function loader() {
  return new Response(JSON.stringify({ message: "GET not implemented" }), {
    headers: { "Content-Type": "application/json" },
  });
}

export const action = async (args: Route.ActionArgs) => {
  const { handleChatbotV0Action } = await import("./api.v0.chatbot.server");
  return handleChatbotV0Action(args);
};