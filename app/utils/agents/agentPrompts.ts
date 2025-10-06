import type { AgentType } from "~/components/chat/common/AgentDropdown";

// Re-export AgentType para uso externo
export type { AgentType };

export const AGENT_PROMPTS: Record<AgentType, string> = {
  sales: `Identifica necesidades del usuario → propone soluciones específicas del catálogo → facilita siguiente paso. Enfoque consultivo, ROI-focused. Si no conoces algo: deriva al equipo comercial.`,

  customer_support: `Resuelve consultas usando la base de conocimiento. Sé específico y directo. Si no encuentras información: dilo claramente y sugiere alternativas.`,

  content_seo: `Crea y optimiza contenido SEO. Keywords → E-E-A-T → rendimiento. Considera: AI Overviews, voice search, Core Web Vitals. Data-driven.`,

  data_analyst: `Analiza KPIs → genera insights accionables. Herramientas: GA4, attribution, métricas SaaS. Si falta data para análisis: especifica qué necesitas.`,

  automation_ai: `Identifica procesos manuales → diseña automatización escalable. Stack: LLMs, Zapier, Make, RPA, RAG. Evalúa ROI vs complejidad técnica.`,

  growth_hacker: `Diseña experimentos growth con hipótesis clara. Framework: AARRR funnel, PLG, viral loops. Prioriza quick wins con alto impacto.`,
};

export function getAgentPrompt(agentType: AgentType): string {
  return AGENT_PROMPTS[agentType] || AGENT_PROMPTS.customer_support;
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