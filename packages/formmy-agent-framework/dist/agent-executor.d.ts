/**
 * Agent Executor: Loop ReAct mejorado con memoria y decisiones inteligentes
 */
import type { AgentContext, AgentCallbacks } from './types';
import { AgentCore } from './agent-core';
export declare class AgentExecutor {
    private core;
    private callbacks?;
    private memory;
    constructor(core: AgentCore, callbacks?: AgentCallbacks);
    /**
     * Ejecuta el loop ReAct mejorado
     */
    run(context: AgentContext): Promise<{
        response: string;
        toolsUsed: string[];
        iterations: number;
        success: boolean;
    }>;
    /**
     * THINK: Decide qué acción tomar basado en contexto y memoria
     */
    private think;
    /**
     * ACT: Ejecuta la acción decidida en el pensamiento
     */
    private act;
    /**
     * OBSERVE: Analiza el resultado de la acción
     */
    private observe;
    /**
     * Calcula iteraciones máximas según complejidad del mensaje
     */
    private calculateMaxIterations;
    /**
     * Estima complejidad del mensaje
     */
    private estimateComplexity;
    /**
     * Construye prompt específico para ejecución de herramientas
     */
    private buildToolExecutionPrompt;
    /**
     * Construye prompt para el pensamiento
     */
    private buildThinkingPrompt;
    /**
     * Solicita decisión al LLM
     */
    private requestDecision;
    /**
     * Decision de fallback basada en keywords
     */
    private makeFallbackDecision;
    /**
     * Genera argumentos básicos para herramientas
     */
    private generateToolArgs;
    /**
     * Ejecuta herramienta utilizando el registry real
     */
    private executeTool;
    /**
     * Genera respuesta final
     */
    private generateResponse;
    /**
     * Sintetiza respuesta final del loop
     */
    private synthesizeResponse;
    /**
     * Ejecuta una herramienta específica
     */
    private executeToolCall;
    /**
     * Wrapper para compatibilidad con proveedores independientes
     */
    private createProviderWrapper;
    /**
     * Explica el razonamiento de una decisión
     */
    private explainReasoning;
    /**
     * Determina si una tarea está completa
     */
    private isTaskComplete;
}
//# sourceMappingURL=agent-executor.d.ts.map