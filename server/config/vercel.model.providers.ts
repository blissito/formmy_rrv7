import { openai } from "@ai-sdk/openai";
import { google } from "@ai-sdk/google";
import { anthropic } from "@ai-sdk/anthropic";
import { getOptimalTemperature } from "./model-temperatures";

export const mapModel = (modelName: string) => {
  switch (modelName) {
    case "claude-sonnet-4-5":
      return anthropic("claude-sonnet-4-5-20250929");
    case "claude-haiku-4-5":
      return anthropic("claude-haiku-4-5-20251001");
    case "gemini-3-flash":
      return google("gemini-3-flash");
    case "gpt-5-nano": // slow
      return openai("gpt-4o-mini");
    default:
      return openai("gpt-4.1-mini");
  }
};

/**
 * 📊 Get Model Info - Retorna provider y model string para tracking
 *
 * Usa la misma fuente de verdad que mapModel() para garantizar
 * consistencia en el tracking de tokens y costos.
 *
 * @param modelName - Nombre del modelo desde chatbot.aiModel
 * @returns { provider, model } para usar en tracking/analytics
 */
export const getModelInfo = (
  modelName: string
): { provider: string; model: string } => {
  switch (modelName) {
    case "claude-sonnet-4-5":
      return { provider: "anthropic", model: "claude-sonnet-4-5-20250929" };
    case "claude-haiku-4-5":
      return { provider: "anthropic", model: "claude-haiku-4-5-20251001" };
    case "gemini-3-flash":
      return { provider: "google", model: "gemini-3-flash" };
    case "gpt-5-nano":
      return { provider: "openai", model: "gpt-4o-mini" };
    default:
      return { provider: "openai", model: "gpt-4.1-mini" };
  }
};

/**
 * 🌡️ Get Model Temperature - Retorna temperatura SOLO para modelos que la necesitan
 *
 * IMPORTANTE: Esta función es conservadora - solo retorna temperatura para Gemini.
 * Los demás modelos (GPT, Claude) funcionan bien sin especificar temperatura,
 * así que retornamos undefined para no afectar su comportamiento.
 *
 * @param modelName - Nombre del modelo desde chatbot.aiModel
 * @returns number para Gemini (0.7), undefined para todos los demás
 */
export function getModelTemperature(modelName: string): number | undefined {
  // Solo Gemini necesita temperatura explícita (su default es muy alto)
  if (modelName === "gemini-3-flash") {
    return getOptimalTemperature(modelName); // 0.7
  }

  // GPT y Claude funcionan bien con sus defaults - NO tocar
  return undefined;
}

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
    const {
      createSearchContextTool,
    } = require("@/server/tools/vercel/ragAgent");
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

  // 💼 SAVE LEAD - Siempre disponible (captura leads)
  const {
    createSaveLeadTool,
  } = require("@/server/tools/vercel/saveLead");
  // ⭐ chatbotId se captura en closure
  tools.save_lead = createSaveLeadTool(options.chatbotId);

  return tools;
}
