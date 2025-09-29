/**
 * API Chatbot V0 - Endpoint específico para AgentEngine_v0
 * Solo maneja chat, no CRUD
 */

import type { ActionFunctionArgs } from "react-router";

export function loader() {
  return new Response(JSON.stringify({ message: "GET not implemented" }), {
    headers: { "Content-Type": "application/json" },
  });
}

export const action = async (args: ActionFunctionArgs) => {
  const { handleChatbotV0Action } = await import("./api.v0.chatbot.server");
  return handleChatbotV0Action(args);
};