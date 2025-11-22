import { openai } from "@ai-sdk/openai";
import { google } from "@ai-sdk/google";
import { anthropic } from "@ai-sdk/anthropic";

export const mapModel = (modelName: string) => {
  switch (modelName) {
    case "claude-sonnet-4-5":
      return anthropic("claude-sonnet-4-5-20250929");
    case "claude-haiku-4-5":
      return anthropic("claude-haiku-4-5-20251001");
    case "gemini-3-pro":
      return google("gemini-3-pro-preview");
    case "gpt-5-nano":
      return openai("gpt-4o-mini");
    default:
      return openai("gpt-4.1-mini");
  }
};

export const mapTools = (modelName: string) => {
  // ⚠️ DEPRECATED: No usar para nuevas implementaciones
  // Usar createPublicTools() para chatbots públicos
  return {};
};

/**
 * 🛠️ Create Public Tools - Factory para tools de chatbots públicos
 *
 * Crea el objeto de tools según el plan del owner y configuración del chatbot.
 *
 * 🔒 SEGURIDAD:
 * - chatbotId se captura en CLOSURE de cada tool
 * - Modelo AI NO puede modificar chatbotId
 * - Solo puede pasar parámetros definidos en el schema
 *
 * @param options - Configuración del chatbot y plan
 * @returns Objeto con tools para Vercel AI SDK
 */
export function createPublicTools(options: {
  chatbotId: string; // ⭐ VALIDADO ANTES de llamar esta función
  ownerPlan: string;
  hasRAG: boolean;
}) {
  const tools: Record<string, any> = {};

  // 🔍 RAG SEARCH - Solo si el chatbot tiene contexts
  if (options.hasRAG) {
    const { createSearchContextTool } = require("@/server/tools/vercel/ragAgent");
    // ⭐ chatbotId se captura en closure del tool
    tools.search_context = createSearchContextTool(options.chatbotId);
  }

  // 📅 DATETIME - Siempre disponible (no cuesta)
  const { createGetDateTimeTool } = require("@/server/tools/vercel/datetime");
  tools.get_current_datetime = createGetDateTimeTool();

  // 🌐 WEB SEARCH - Solo planes PRO y ENTERPRISE
  if (["PRO", "ENTERPRISE"].includes(options.ownerPlan)) {
    const { createWebSearchTool } = require("@/server/tools/vercel/webSearch");
    tools.web_search_google = createWebSearchTool();
  }

  // 💼 SAVE CONTACT - Siempre disponible (captura leads)
  const { createSaveContactTool } = require("@/server/tools/vercel/saveContact");
  // ⭐ chatbotId se captura en closure
  tools.save_contact_info = createSaveContactTool(options.chatbotId);

  return tools;
}
