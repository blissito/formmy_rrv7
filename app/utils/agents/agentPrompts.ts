import type { AgentType } from "~/components/chat/common/AgentDropdown";

export const AGENT_PROMPTS: Record<AgentType, string> = {
  sales: `Ventas consultivas. Identifica necesidades → propone soluciones → cierra deals. ROI-focused.`,

  customer_support: `Eres un agente de soporte al cliente. Ayuda rápido y eficaz.`,

  content_seo: `SEO y contenido. Keywords → contenido E-E-A-T → rankings. AI Overview, voice search, Core Web Vitals.`,

  data_analyst: `Data analyst. KPIs → análisis → insights accionables. GA4, attribution, métricas SaaS.`,

  automation_ai: `Automatización + IA. Procesos → automatizar → escalar. LLMs, Zapier, Make, RPA, RAG.`,

  growth_hacker: `Growth hacking. Experimentos → datos → escalar. PLG, viral loops, AARRR funnel.`,
};

const CRITICAL_RULES = `
REGLAS:
- Usa herramientas cuando sea necesario
- No finjas acciones que no hiciste
- Si no sabes algo, dilo`;

export function getAgentPrompt(agentType: AgentType): string {
  const basePrompt = AGENT_PROMPTS[agentType] || AGENT_PROMPTS.customer_support;
  
  // Solo agregar reglas críticas al agente de soporte por ahora
  if (agentType === 'customer_support') {
    return basePrompt + CRITICAL_RULES;
  }
  
  return basePrompt;
}

export function getAgentName(agentType: AgentType): string {
  const names: Record<AgentType, string> = {
    sales: "Agente de Ventas",
    customer_support: "Soporte al Cliente",
    content_seo: "Contenido y SEO",
    data_analyst: "Analista de Datos",
    automation_ai: "Automatización e IA",
    growth_hacker: "Growth Hacker",
  };
  return names[agentType] || "Agente";
}

// Mensajes de bienvenida personalizados por tipo de agente
export const AGENT_WELCOME_MESSAGES: Record<AgentType, string> = {
  sales: "¿Cuál es tu objetivo de negocio?",

  customer_support: "Hola, ¿en qué puedo ayudarte?",

  content_seo: "¿Qué contenido necesitas?",

  data_analyst: "¿Qué métricas analizar?",

  automation_ai: "¿Qué automatizar?",

  growth_hacker: "¿Meta de crecimiento?"
};

// Mensajes de despedida personalizados por tipo de agente
export const AGENT_GOODBYE_MESSAGES: Record<AgentType, string> = {
  sales: "¿Necesitas algo más?",

  customer_support: "¿Algo más en lo que pueda ayudarte?",

  content_seo: "¿Más contenido?",

  data_analyst: "¿Otro análisis?",

  automation_ai: "¿Algo más por automatizar?",

  growth_hacker: "¿Siguiente experimento?"
};

export function getAgentWelcomeMessage(agentType: AgentType): string {
  return AGENT_WELCOME_MESSAGES[agentType] || AGENT_WELCOME_MESSAGES.customer_support;
}

export function getAgentGoodbyeMessage(agentType: AgentType): string {
  return AGENT_GOODBYE_MESSAGES[agentType] || AGENT_GOODBYE_MESSAGES.customer_support;
}

// Colores temáticos para cada tipo de agente
export const AGENT_COLORS: Record<AgentType, string> = {
  sales: "#10B981",        // Verde esmeralda - confianza y crecimiento
  customer_support: "#3B82F6",  // Azul - confiabilidad y soporte
  content_seo: "#8B5CF6",  // Violeta - creatividad y estrategia
  data_analyst: "#F59E0B", // Ámbar - análisis y claridad
  automation_ai: "#06B6D4", // Cian - tecnología e innovación
  growth_hacker: "#EF4444"  // Rojo - energía y acción rápida
};

export function getAgentColor(agentType: AgentType): string {
  return AGENT_COLORS[agentType] || AGENT_COLORS.customer_support;
}