/**
 * Configuration for Ghosty LlamaIndex agent
 */

import type { GhostyConfig } from './types';

export const DEFAULT_GHOSTY_CONFIG: GhostyConfig = {
  mode: 'local', // Default to local LlamaIndex implementation
  llmProvider: 'openai',
  model: 'gpt-4o-mini', // Use stable GPT-4 model
  temperature: 0.7,
  maxTokens: 2000,
  systemPrompt: `Eres Ghosty 👻, asistente inteligente de Formmy.

**INSTRUCCIÓN CRÍTICA**: Para cualquier pregunta sobre chatbots, estadísticas o información del usuario, SIEMPRE usa las herramientas disponibles. NO adivines ni respondas sin consultar los datos reales.

**HERRAMIENTAS DISPONIBLES**:
- query_chatbots: Para consultar información de chatbots del usuario
- get_chatbot: Para obtener detalles de un chatbot específico  
- get_chatbot_stats: Para obtener estadísticas y métricas
- web_search: Para búsquedas en internet
- web_fetch: Para obtener contenido de páginas web

**REGLAS DE USO DE HERRAMIENTAS**:
1. Si preguntan sobre "cuántos bots", "mis chatbots", "bots que tengo" → USA query_chatbots
2. Si preguntan sobre estadísticas, conversaciones, mensajes → USA get_chatbot_stats
3. Si preguntan sobre un chatbot específico → USA get_chatbot
4. Para información actualizada de internet → USA web_search
5. NUNCA respondas sin usar herramientas cuando se trata de datos del usuario

**CONTEXTO DEL USUARIO**:
- Eres asistente del DUEÑO del negocio que usa Formmy
- Ayúdalo a gestionar sus chatbots y ver estadísticas
- Usa un tono profesional pero amigable

**PROCESO**:
1. Identifica qué información necesita el usuario
2. USA la herramienta apropiada para obtener datos reales
3. Responde en español con la información obtenida
4. Sé conciso pero completo (máximo 200 palabras)`
};

export const REMOTE_CONFIG = {
  endpoint: process.env.GHOSTY_REMOTE_ENDPOINT || 'https://agents.formmy.app/api/chat',
  apiKey: process.env.GHOSTY_REMOTE_API_KEY,
  timeout: 30000, // 30 seconds
};

export const LLM_CONFIGS = {
  'gpt-4o-mini': {
    provider: 'openai' as const,
    model: 'gpt-4o-mini',
    temperature: 0.7,
    maxTokens: 2000,
  },
  'gpt-4o': {
    provider: 'openai' as const,
    model: 'gpt-4o',
    temperature: 0.7,
    maxTokens: 2000,
  },
  'claude-3-haiku-20240307': {
    provider: 'anthropic' as const,
    model: 'claude-3-haiku-20240307',
    temperature: 0.7,
    maxTokens: 2000,
  },
  'claude-3-5-haiku-20241022': {
    provider: 'anthropic' as const,
    model: 'claude-3-5-haiku-20241022',
    temperature: 0.5,
    maxTokens: 2000,
  },
} as const;

/**
 * Get configuration for a specific model
 */
export function getModelConfig(model: string) {
  return LLM_CONFIGS[model as keyof typeof LLM_CONFIGS] || LLM_CONFIGS['gpt-4o-mini'];
}

/**
 * Get Ghosty configuration based on environment and user plan
 */
export function getGhostyConfig(userPlan: string, preferredModel?: string): GhostyConfig {
  const model = preferredModel || getModelForPlan(userPlan);
  const modelConfig = getModelConfig(model);
  
  return {
    ...DEFAULT_GHOSTY_CONFIG,
    llmProvider: modelConfig.provider,
    model: modelConfig.model,
    temperature: modelConfig.temperature,
    maxTokens: modelConfig.maxTokens,
    mode: process.env.GHOSTY_MODE === 'remote' ? 'remote' : 'local',
    remoteEndpoint: REMOTE_CONFIG.endpoint,
    remoteApiKey: REMOTE_CONFIG.apiKey,
  };
}

/**
 * Get model based on user plan (from existing logic)
 */
function getModelForPlan(plan: string): string {
  switch (plan) {
    case 'ENTERPRISE':
      return 'gpt-4o';
    case 'PRO':
    case 'TRIAL':
      return 'gpt-4o-mini'; // Use stable GPT-4o-mini for testing
    case 'STARTER':
      return 'gpt-4o-mini';
    default:
      return 'gpt-4o-mini'; // Default to stable model
  }
}