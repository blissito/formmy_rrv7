/**
 * Core del agente: Retry logic y error handling
 */
import type { RetryConfig, AgentCallbacks } from './types';
export declare class AgentCore {
    private retryConfig;
    private callbacks?;
    constructor(retryConfig?: RetryConfig, callbacks?: AgentCallbacks | undefined);
    /**
     * Ejecuta una función con retry automático y manejo de errores
     */
    executeWithRetry<T>(operation: () => Promise<T>, context?: string): Promise<T>;
    /**
     * Verifica si un resultado es válido (no vacío o nulo)
     */
    private isValidResult;
    /**
     * Calcula el tiempo de espera para el siguiente intento
     */
    private calculateBackoffMs;
    /**
     * Espera el tiempo calculado antes del siguiente retry
     */
    private waitForRetry;
    /**
     * Maneja errores de manera inteligente y decide si vale la pena retry
     */
    shouldRetry(error: Error, attempt: number): boolean;
    /**
     * Genera un mensaje de error contextual para el usuario
     */
    generateUserFriendlyError(error: Error, context: string): string;
}
//# sourceMappingURL=agent-core.d.ts.map