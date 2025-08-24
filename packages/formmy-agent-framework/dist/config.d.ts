/**
 * Configuration and Factory para Formmy Agent Framework
 */
import type { AgentConfig } from './types';
import { FormmyAgent } from './index';
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
declare const MODEL_CONFIGS: {
    readonly 'gpt-5-nano': {
        readonly temperature: undefined;
        readonly maxIterations: 5;
        readonly contextLimit: 4000;
        readonly retryConfig: {
            readonly maxRetries: 3;
            readonly backoffMs: 1000;
            readonly exponentialBackoff: true;
        };
    };
    readonly 'claude-3-haiku': {
        readonly temperature: 0.7;
        readonly maxIterations: 4;
        readonly contextLimit: 3500;
        readonly retryConfig: {
            readonly maxRetries: 4;
            readonly backoffMs: 1500;
            readonly exponentialBackoff: true;
        };
    };
    readonly 'claude-3-haiku-20240307': {
        readonly temperature: 0.7;
        readonly maxIterations: 4;
        readonly contextLimit: 3500;
        readonly retryConfig: {
            readonly maxRetries: 4;
            readonly backoffMs: 1500;
            readonly exponentialBackoff: true;
        };
    };
    readonly 'claude-3.5-haiku': {
        readonly temperature: 0.5;
        readonly maxIterations: 6;
        readonly contextLimit: 4000;
        readonly retryConfig: {
            readonly maxRetries: 3;
            readonly backoffMs: 1000;
            readonly exponentialBackoff: true;
        };
    };
    readonly 'claude-3-5-haiku-20241022': {
        readonly temperature: 0.5;
        readonly maxIterations: 6;
        readonly contextLimit: 4000;
        readonly retryConfig: {
            readonly maxRetries: 3;
            readonly backoffMs: 1000;
            readonly exponentialBackoff: true;
        };
    };
    readonly 'gpt-5-mini': {
        readonly temperature: 0.3;
        readonly maxIterations: 6;
        readonly contextLimit: 5000;
        readonly retryConfig: {
            readonly maxRetries: 2;
            readonly backoffMs: 800;
            readonly exponentialBackoff: true;
        };
    };
};
/**
 * Factory principal para crear agentes desde configuración
 */
export declare const createAgent: (agentConfig: AgentConfig) => FormmyAgent;
/**
 * Factory para crear agentes desde un Chatbot (para compatibilidad con Formmy)
 */
export declare const createAgentFromChatbot: (chatbot: Chatbot, user?: User, toolsProvider?: (plan: string) => any[]) => Promise<FormmyAgent>;
/**
 * Factory simplificado para testing
 */
export declare const createTestAgent: (model?: string) => FormmyAgent;
/**
 * Configuraciones específicas por plan de usuario
 */
export declare const getPlanConfig: (userPlan: string) => Partial<AgentConfig>;
/**
 * Helper para actualizar configuración según contexto
 */
export declare const adaptConfigForContext: (baseConfig: AgentConfig, contextSize: number, messageComplexity: "low" | "medium" | "high") => AgentConfig;
/**
 * Configuración de desarrollo/debug
 */
export declare const createDebugAgent: (model?: string) => FormmyAgent;
/**
 * Exportar configuraciones para referencia
 */
export { MODEL_CONFIGS };
/**
 * Tipos exportados para usar en la integración
 */
export type { User, Chatbot };
//# sourceMappingURL=config.d.ts.map