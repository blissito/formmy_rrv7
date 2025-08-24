/**
 * Formmy Agent Framework - Core del micro-framework
 */
import type { AgentConfig, ChatOptions, AgentResponse, RetryConfig } from './types';
export declare class FormmyAgent {
    private core;
    private executor;
    private contextOptimizer;
    private config;
    constructor(config: AgentConfig);
    /**
     * Método principal para chat con el agente
     */
    chat(message: string, options?: ChatOptions): Promise<AgentResponse>;
    /**
     * Método simplificado para testing/preview
     */
    preview(message: string): Promise<string>;
    /**
     * Optimiza contexto para la consulta
     */
    private optimizeContext;
    /**
     * Obtiene herramientas disponibles para el usuario/contexto
     */
    private getAvailableTools;
    /**
     * Decide si usar agent loop complejo o respuesta directa
     */
    private shouldUseAgentLoop;
    /**
     * Ejecuta agent loop completo
     */
    private executeAgentLoop;
    /**
     * Ejecuta respuesta directa sin loop
     */
    private executeDirectResponse;
    /**
     * Genera respuesta simple sin agent loop
     */
    private generateSimpleResponse;
    /**
     * Obtiene estadísticas de rendimiento del agente
     */
    getStats(): {
        model: string;
        contextLimit: number;
        maxIterations: number;
        retryConfig: RetryConfig;
    };
    /**
     * Actualiza configuración del agente
     */
    updateConfig(newConfig: Partial<AgentConfig>): void;
    /**
     * Método de utilidad para debug
     */
    debug(message: string, options?: ChatOptions): Promise<{
        response: AgentResponse;
        debug: {
            contextOptimized: string;
            toolsAvailable: string[];
            usedAgentLoop: boolean;
            processingTime: number;
        };
    }>;
}
export * from './types';
export { AgentCore } from './agent-core';
export { AgentExecutor } from './agent-executor';
export { ContextOptimizer } from './context-optimizer';
export { ContextChunker } from './context-chunker';
export { createAgent, createTestAgent } from './config';
//# sourceMappingURL=index.d.ts.map