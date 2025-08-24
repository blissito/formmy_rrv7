/**
 * Formmy Agent Framework - Core del micro-framework
 */
import { AgentCore } from './agent-core';
import { AgentExecutor } from './agent-executor';
import { ContextOptimizer } from './context-optimizer';
// Tools registry will be injected via configuration or options
export class FormmyAgent {
    constructor(config) {
        this.config = {
            maxIterations: 5,
            contextLimit: 4000,
            retryConfig: { maxRetries: 3, backoffMs: 1000, exponentialBackoff: true },
            ...config
        };
        // Inicializar componentes
        this.core = new AgentCore(this.config.retryConfig, this.config.callbacks);
        this.executor = new AgentExecutor(this.core, this.config.callbacks);
        this.contextOptimizer = new ContextOptimizer(this.config.contextLimit);
        console.log(`🤖 FormmyAgent initialized with model: ${this.config.model}`);
    }
    /**
     * Método principal para chat con el agente
     */
    async chat(message, options = {}) {
        const startTime = Date.now();
        try {
            console.log(`🚀 FormmyAgent: "${message.substring(0, 50)}..." (${options.model})`);
            // 1. Optimizar contexto si es necesario
            const optimizedContext = await this.optimizeContext(options.contexts || [], message);
            console.log(`📄 Context: ${options.contexts?.length || 0} items → optimized to ${optimizedContext.length} chars`);
            // 2. Preparar herramientas disponibles
            const availableTools = await this.getAvailableTools(options);
            console.log(`🛠️ Tools available: [${availableTools.map(t => t.name).join(', ')}]`);
            // 3. Crear contexto del agente
            const agentContext = {
                message,
                contexts: options.contexts || [],
                conversationHistory: options.conversationHistory || [],
                tools: availableTools,
                model: options.model || this.config.model,
                stream: options.stream || false,
                user: options.user,
                chatbotId: options.chatbotId,
                sessionId: options.sessionId
            };
            // 4. Decidir si usar agent loop o respuesta directa
            if (this.shouldUseAgentLoop(message, availableTools)) {
                console.log('🔄 Using agent loop for complex task');
                return await this.executeAgentLoop(agentContext);
            }
            else {
                console.log('💨 Using direct response for simple query');
                return await this.executeDirectResponse(message, optimizedContext, agentContext);
            }
        }
        catch (error) {
            console.error('❌ FormmyAgent chat error:', error);
            return {
                content: this.core.generateUserFriendlyError(error, 'chat-execution'),
                toolsUsed: [],
                iterations: 0,
                error: error.message
            };
        }
        finally {
            const duration = Date.now() - startTime;
            console.log(`⏱️ Chat completed in ${duration}ms`);
        }
    }
    /**
     * Método simplificado para testing/preview
     */
    async preview(message) {
        const response = await this.chat(message, {
            contexts: [],
            model: this.config.model,
            stream: false,
            user: null
        });
        return response.content;
    }
    /**
     * Optimiza contexto para la consulta
     */
    async optimizeContext(contexts, message) {
        if (!contexts || contexts.length === 0) {
            return '';
        }
        console.log(`📄 Optimizing ${contexts.length} contexts for query`);
        const optimized = await this.contextOptimizer.optimize(contexts, message);
        if (optimized) {
            const stats = this.contextOptimizer.getOptimizationStats(contexts, optimized);
            console.log(`📊 Context optimization: ${stats.originalTokens}→${stats.optimizedTokens} tokens (${stats.reduction}% reduction)`);
        }
        return optimized;
    }
    /**
     * Obtiene herramientas disponibles para el usuario/contexto
     */
    async getAvailableTools(options) {
        try {
            // Si hay una función personalizada para obtener herramientas, usarla
            if (options.toolsProvider && typeof options.toolsProvider === 'function') {
                return await options.toolsProvider(options.user, options);
            }
            // Si se proporcionan herramientas directamente en las opciones
            if (options.tools && Array.isArray(options.tools)) {
                return options.tools;
            }
            // Fallback: sin herramientas
            return [];
        }
        catch (error) {
            console.error('Error getting available tools:', error);
            return []; // Fallback seguro
        }
    }
    /**
     * Decide si usar agent loop complejo o respuesta directa
     */
    shouldUseAgentLoop(message, tools) {
        // No usar loop si no hay herramientas disponibles
        if (tools.length === 0) {
            return false;
        }
        const messageLC = message.toLowerCase();
        // Keywords que requieren herramientas/loop complejo
        const complexKeywords = [
            'recordatorio', 'agenda', 'agendar', 'recordarme',
            'pago', 'cobrar', 'link', 'stripe',
            'crear', 'generar', 'enviar', 'programar',
            'búsqueda', 'buscar', 'encontrar', 'listar'
        ];
        const requiresTools = complexKeywords.some(kw => messageLC.includes(kw));
        // También considerar longitud y complejidad
        const isComplexQuery = message.length > 100 ||
            message.split(' ').length > 15 ||
            message.includes('?') && message.includes('cómo');
        return requiresTools || isComplexQuery;
    }
    /**
     * Ejecuta agent loop completo
     */
    async executeAgentLoop(context) {
        const result = await this.executor.run(context);
        return {
            content: result.response,
            toolsUsed: result.toolsUsed,
            iterations: result.iterations,
            usage: {
                inputTokens: 0, // TODO: trackear tokens
                outputTokens: 0,
                totalTokens: 0
            }
        };
    }
    /**
     * Ejecuta respuesta directa sin loop
     */
    async executeDirectResponse(message, context, agentContext) {
        // Construir prompt simple
        let prompt = message;
        if (context.trim()) {
            prompt = `Contexto relevante:
${context}

Pregunta del usuario:
${message}

Responde de forma directa y útil basándote en el contexto proporcionado.`;
        }
        // Generar respuesta (placeholder - se integraría con tus proveedores)
        const response = await this.generateSimpleResponse(prompt, agentContext);
        return {
            content: response,
            toolsUsed: [],
            iterations: 1,
            usage: {
                inputTokens: Math.ceil(prompt.length * 0.25),
                outputTokens: Math.ceil(response.length * 0.25),
                totalTokens: Math.ceil((prompt.length + response.length) * 0.25)
            }
        };
    }
    /**
     * Genera respuesta simple sin agent loop
     */
    async generateSimpleResponse(prompt, context) {
        return await this.core.executeWithRetry(async () => {
            // Si hay un proveedor de AI personalizado, usarlo
            if (this.config.aiProvider && typeof this.config.aiProvider.chatCompletion === 'function') {
                try {
                    // Construir mensajes incluyendo historial si está disponible
                    const messages = [];
                    if (context.conversationHistory && context.conversationHistory.length > 0) {
                        messages.push(...context.conversationHistory);
                    }
                    messages.push({ role: 'user', content: prompt });
                    const chatRequest = {
                        model: context.model,
                        messages,
                        temperature: context.model === 'gpt-5-nano' ? undefined : 0.7,
                        maxTokens: 800,
                        stream: false // Siempre no-streaming para respuestas simples
                    };
                    const result = await this.config.aiProvider.chatCompletion(chatRequest);
                    return result.content || 'No pude generar una respuesta en este momento.';
                }
                catch (error) {
                    console.error('❌ Error in generateSimpleResponse:', error);
                    return `Lo siento, ocurrió un error al procesar tu consulta: ${error.message}`;
                }
            }
            // Fallback: respuesta estática si no hay proveedor configurado
            return `Framework configurado correctamente. Para usar respuestas de AI reales, configure un proveedor de AI en la configuración del agente.
      
Query recibido: "${prompt.substring(0, 100)}..."`;
        }, 'simple-response');
    }
    /**
     * Obtiene estadísticas de rendimiento del agente
     */
    getStats() {
        return {
            model: this.config.model,
            contextLimit: this.config.contextLimit || 4000,
            maxIterations: this.config.maxIterations || 5,
            retryConfig: this.config.retryConfig
        };
    }
    /**
     * Actualiza configuración del agente
     */
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        console.log('🔧 Agent config updated:', newConfig);
    }
    /**
     * Método de utilidad para debug
     */
    async debug(message, options = {}) {
        const startTime = Date.now();
        const debugInfo = {
            contextOptimized: '',
            toolsAvailable: [],
            usedAgentLoop: false,
            processingTime: 0
        };
        // Optimizar contexto
        debugInfo.contextOptimized = await this.optimizeContext(options.contexts || [], message);
        // Obtener herramientas
        const tools = await this.getAvailableTools(options);
        debugInfo.toolsAvailable = tools.map(t => t.name);
        // Determinar si usar agent loop
        debugInfo.usedAgentLoop = this.shouldUseAgentLoop(message, tools);
        // Ejecutar chat
        const response = await this.chat(message, options);
        debugInfo.processingTime = Date.now() - startTime;
        return { response, debug: debugInfo };
    }
}
// Exports para facilitar importación
export * from './types';
export { AgentCore } from './agent-core';
export { AgentExecutor } from './agent-executor';
export { ContextOptimizer } from './context-optimizer';
export { ContextChunker } from './context-chunker';
export { createAgent, createTestAgent } from './config';
