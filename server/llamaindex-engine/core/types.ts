/**
 * LlamaIndex Engine v0.0.1 - Core Types
 *
 * Base types para el motor que soportará cientos de agentes especializados
 */

import type { User, Chatbot } from "@prisma/client";
import type { FunctionTool } from "llamaindex";

/**
 * Configuración del motor base - agnóstica de agente específico
 */
export interface EngineConfig {
  model: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt: string;
  tools: FunctionTool[];
  maxIterations?: number;

  // Metadata para debugging
  agentName?: string;
  version?: string;
}

/**
 * Contexto de ejecución - información del entorno
 */
export interface ExecutionContext {
  user: User;
  chatbot?: Chatbot; // Opcional para agentes que no son chatbots
  sessionId?: string;
  conversationHistory?: Array<{ role: string; content: string }>;
  integrations?: Record<string, any>;

  // Metadata adicional que los agentes pueden necesitar
  metadata?: Record<string, any>;
}

/**
 * Respuesta estándar del motor
 */
export interface EngineResponse {
  content: string;
  toolsUsed: string[];

  // Metadata siempre presente
  metadata: {
    model: string;
    agentName?: string;
    processingTime: number;
    iterations: number;
    tokensUsed?: {
      input: number;
      output: number;
      total: number;
    };
  };

  // Información opcional para debugging
  debug?: {
    toolDetails?: Array<{
      name: string;
      parameters: any;
      result: any;
      executionTime: number;
    }>;
    promptTokens?: number;
    rawResponse?: any;
  };

  // Manejo de errores
  error?: string;
  warnings?: string[];
}

/**
 * Interface para agentes que usan el motor
 */
export interface Agent {
  name: string;
  version: string;
  description: string;

  chat(message: string, context: ExecutionContext): Promise<EngineResponse>;
  getConfig(): EngineConfig;
  test(): Promise<{ success: boolean; error?: string }>;
}

/**
 * Configuración de herramientas con permisos
 */
export interface ToolConfig {
  name: string;
  tool: FunctionTool;
  requiredPlans?: string[];
  requiredIntegrations?: string[];
  agentRestrictions?: string[]; // Solo estos agentes pueden usar esta tool
}

/**
 * Registry de herramientas global
 */
export interface ToolRegistry {
  register(config: ToolConfig): void;
  getAvailableTools(context: {
    agentName: string;
    userPlan: string;
    integrations: Record<string, any>;
  }): FunctionTool[];
  listAllTools(): ToolConfig[];
}

/**
 * Factory para crear agentes
 */
export interface AgentFactory {
  createGhostyAgent(user: User): Promise<Agent>;
  createChatbotAgent(chatbot: Chatbot, user: User): Promise<Agent>;
  createCommandPaletteAgent(user: User): Promise<Agent>;

  // Future agents
  createFormBuilderAgent?(user: User): Promise<Agent>;
  createAPIAgent?(user: User): Promise<Agent>;

  // Registry de agentes disponibles
  listAvailableAgents(): string[];
}

/**
 * Configuración específica por tipo de agente
 */
export interface AgentProfile {
  name: string;
  version: string;
  description: string;

  // Configuración del modelo
  defaultModel: string;
  allowModelOverride: boolean;

  // Herramientas permitidas
  allowedTools: string[];

  // Prompts
  systemPromptTemplate: string;

  // Configuraciones del motor
  maxIterations: number;
  temperature?: number;

  // Metadata para UI
  uiLevel: 'minimal' | 'simple' | 'advanced';
  capabilities: string[];
}

/**
 * Evento del sistema para logging/monitoring
 */
export interface EngineEvent {
  type: 'agent_created' | 'chat_started' | 'chat_completed' | 'tool_executed' | 'error';
  agentName: string;
  userId: string;
  timestamp: Date;
  metadata: Record<string, any>;
}