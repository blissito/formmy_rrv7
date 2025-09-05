/**
 * Configuration and Factory para Formmy Agent Framework
 */

import type { AgentConfig, AgentCallbacks } from './types';
import { FormmyAgent } from './index';
import { getAvailableTools } from '../tools/registry';

// Tipos de Prisma para compatibilidad
type User = {
  plan: string;
  id: string;
};

type Chatbot = {
  id: string;
  aiModel: string;
  temperature?: number | null;
  user: User;
  userId: string;
};

/**
 * Configuraciones predefinidas por modelo
 */
const MODEL_CONFIGS = {
  'gpt-5-nano': {
    temperature: undefined, // GPT-5-nano no soporta temperature
    maxIterations: 5,
    contextLimit: 4000,
    retryConfig: { maxRetries: 3, backoffMs: 1000, exponentialBackoff: true }
  },
  'claude-3-haiku': {
    temperature: 0.7, // Haiku es impredecible, pero intentamos controlarlo
    maxIterations: 4, // Menos iteraciones para Haiku
    contextLimit: 3500, // Ligeramente menos contexto
    retryConfig: { maxRetries: 4, backoffMs: 1500, exponentialBackoff: true } // Más retries para Haiku
  },
  'claude-3-haiku-20240307': {
    temperature: 0.7, // Haiku es impredecible, pero intentamos controlarlo
    maxIterations: 4, // Menos iteraciones para Haiku
    contextLimit: 3500, // Ligeramente menos contexto
    retryConfig: { maxRetries: 4, backoffMs: 1500, exponentialBackoff: true } // Más retries para Haiku
  },
  'claude-3.5-haiku': {
    temperature: 0.5, // Intentar ser más determinista
    maxIterations: 6, // 3.5 es más estable
    contextLimit: 4000,
    retryConfig: { maxRetries: 3, backoffMs: 1000, exponentialBackoff: true }
  },
  'claude-3-5-haiku-20241022': {
    temperature: 0.5, // Intentar ser más determinista
    maxIterations: 6, // 3.5 es más estable
    contextLimit: 4000,
    retryConfig: { maxRetries: 3, backoffMs: 1000, exponentialBackoff: true }
  },
  'gpt-5-mini': {
    temperature: 0.3, // Más determinista
    maxIterations: 6,
    contextLimit: 5000, // Modelo más capaz
    retryConfig: { maxRetries: 2, backoffMs: 800, exponentialBackoff: true }
  }
} as const;

/**
 * Factory principal para crear agentes desde un Chatbot
 */
export const createAgent = async (chatbot: Chatbot, user?: User): Promise<FormmyAgent> => {
  const modelConfig = MODEL_CONFIGS[chatbot.aiModel as keyof typeof MODEL_CONFIGS] || 
                      MODEL_CONFIGS['gpt-5-nano']; // Fallback default

  // Obtener herramientas disponibles para el usuario
  // Usar user parameter o fallback a chatbot.user
  const userPlan = user?.plan || (chatbot as any).user?.plan || 'FREE';
  const availableTools = getAvailableTools(userPlan, {}, true);

  const config: AgentConfig = {
    model: chatbot.aiModel,
    temperature: chatbot.temperature ?? modelConfig.temperature,
    maxIterations: modelConfig.maxIterations,
    contextLimit: modelConfig.contextLimit,
    retryConfig: modelConfig.retryConfig,
    tools: availableTools,
    callbacks: createCallbacks(chatbot.id)
  };

  console.log(`🏗️ Creating agent for chatbot ${chatbot.id} with model ${chatbot.aiModel}`);
  
  return new FormmyAgent(config);
};

/**
 * Factory simplificado para testing
 */
export const createTestAgent = (model: string = 'gpt-5-nano'): FormmyAgent => {
  const modelConfig = MODEL_CONFIGS[model as keyof typeof MODEL_CONFIGS] || 
                      MODEL_CONFIGS['gpt-5-nano'];

  const config: AgentConfig = {
    model,
    temperature: modelConfig.temperature,
    maxIterations: 3, // Menos iteraciones para tests
    contextLimit: 2000, // Menos contexto para tests
    retryConfig: { maxRetries: 2, backoffMs: 500, exponentialBackoff: false },
    tools: [],
    callbacks: createTestCallbacks()
  };

  return new FormmyAgent(config);
};

/**
 * Crea callbacks para producción
 */
const createCallbacks = (chatbotId: string): AgentCallbacks => {
  return {
    onThought: (thought) => {
      console.log(`🤔 [${chatbotId}] Thought (${thought.confidence}): ${thought.reasoning}`);
    },
    
    onAction: (action) => {
      console.log(`⚡ [${chatbotId}] Action: ${action.type}${action.tool ? ` (${action.tool})` : ''}`);
    },
    
    onError: (error, context) => {
      console.error(`❌ [${chatbotId}] Error in ${context}:`, error.message);
    },
    
    onObservation: (observation) => {
      const status = observation.success ? '✅' : '❌';
      console.log(`👁️ [${chatbotId}] ${status} ${observation.content.substring(0, 100)}...`);
    }
  };
};

/**
 * Crea callbacks para testing (más silenciosos)
 */
const createTestCallbacks = (): AgentCallbacks => {
  return {
    onThought: (thought) => {
      // Solo log en caso de baja confianza
      if (thought.confidence < 0.5) {
        console.log(`🤔 Test - Low confidence: ${thought.confidence}`);
      }
    },
    
    onError: (error, context) => {
      console.error(`❌ Test error in ${context}:`, error.message);
    },
    
    // onAction y onObservation silenciosos para tests
    onAction: () => {},
    onObservation: () => {}
  };
};

/**
 * Configuraciones específicas por plan de usuario
 */
export const getPlanConfig = (userPlan: string): Partial<AgentConfig> => {
  switch (userPlan.toUpperCase()) {
    case 'FREE':
      return {
        maxIterations: 3,
        contextLimit: 2000,
        retryConfig: { maxRetries: 2, backoffMs: 1500 }
      };
      
    case 'STARTER':
      return {
        maxIterations: 4,
        contextLimit: 3000,
        retryConfig: { maxRetries: 3, backoffMs: 1000 }
      };
      
    case 'PRO':
      return {
        maxIterations: 6,
        contextLimit: 5000,
        retryConfig: { maxRetries: 3, backoffMs: 800 }
      };
      
    case 'ENTERPRISE':
      return {
        maxIterations: 8,
        contextLimit: 8000,
        retryConfig: { maxRetries: 4, backoffMs: 500 }
      };
      
    default:
      return {};
  }
};

/**
 * Helper para actualizar configuración según contexto
 */
export const adaptConfigForContext = (
  baseConfig: AgentConfig, 
  contextSize: number,
  messageComplexity: 'low' | 'medium' | 'high'
): AgentConfig => {
  const adaptedConfig = { ...baseConfig };
  
  // Ajustar límite de contexto si hay mucho contenido
  if (contextSize > 10000) { // 10KB
    adaptedConfig.contextLimit = Math.max(2000, adaptedConfig.contextLimit! * 0.7);
  }
  
  // Ajustar iteraciones según complejidad
  switch (messageComplexity) {
    case 'high':
      adaptedConfig.maxIterations = Math.min(8, (adaptedConfig.maxIterations || 5) + 2);
      break;
    case 'low':
      adaptedConfig.maxIterations = Math.max(2, (adaptedConfig.maxIterations || 5) - 1);
      break;
  }
  
  return adaptedConfig;
};

/**
 * Configuración de desarrollo/debug
 */
export const createDebugAgent = (model: string = 'gpt-5-nano'): FormmyAgent => {
  const config: AgentConfig = {
    model,
    temperature: undefined,
    maxIterations: 3,
    contextLimit: 1000,
    retryConfig: { maxRetries: 1, backoffMs: 100, exponentialBackoff: false },
    tools: [],
    callbacks: {
      onThought: (thought) => console.log('🤔 DEBUG Thought:', thought),
      onAction: (action) => console.log('⚡ DEBUG Action:', action),
      onError: (error) => console.log('❌ DEBUG Error:', error),
      onObservation: (obs) => console.log('👁️ DEBUG Observation:', obs)
    }
  };

  return new FormmyAgent(config);
};

/**
 * Exportar configuraciones para referencia
 */
export { MODEL_CONFIGS };

/**
 * Tipos exportados para usar en la integración
 */
export type { User, Chatbot };