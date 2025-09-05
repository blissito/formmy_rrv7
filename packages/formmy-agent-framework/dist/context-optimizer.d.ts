/**
 * Context Optimizer: Optimización inteligente de contexto para reducir tokens
 */
import type { ContextItem } from './types';
export declare class ContextOptimizer {
    private chunker;
    private readonly maxTokens;
    private readonly tokensPerChar;
    constructor(maxTokens?: number, tokensPerChar?: number);
    /**
     * Optimiza contextos para un mensaje específico
     */
    optimize(contexts: ContextItem[], userMessage: string): Promise<string>;
    /**
     * Estima tokens de un texto
     */
    private estimateTokens;
    /**
     * Trunca texto para que no exceda un límite de tokens
     */
    private truncateToTokens;
    /**
     * Formatea un chunk con su fuente
     */
    private formatChunk;
    /**
     * Añade un resumen del contexto si es muy largo
     */
    private addContextSummary;
    /**
     * Genera un resumen básico del contexto (sin LLM)
     */
    private generateContextSummary;
    /**
     * Extrae la primera oración de un texto
     */
    private extractFirstSentence;
    /**
     * Detecta si el contexto necesita optimización
     */
    shouldOptimize(contexts: ContextItem[]): boolean;
    /**
     * Obtiene estadísticas del contexto optimizado
     */
    getOptimizationStats(original: ContextItem[], optimized: string): {
        originalTokens: number;
        optimizedTokens: number;
        reduction: number;
        chunksUsed: number;
    };
    /**
     * Prioriza contextos por relevancia y frecuencia de uso
     */
    prioritizeContexts(contexts: ContextItem[], userMessage: string): ContextItem[];
    /**
     * Calcula relevancia de un contexto para la query
     */
    private calculateContextRelevance;
}
//# sourceMappingURL=context-optimizer.d.ts.map