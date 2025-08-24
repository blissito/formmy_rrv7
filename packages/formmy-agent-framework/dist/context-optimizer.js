/**
 * Context Optimizer: Optimización inteligente de contexto para reducir tokens
 */
import { ContextChunker } from './context-chunker';
export class ContextOptimizer {
    constructor(maxTokens = 4000, tokensPerChar = 0.25) {
        this.maxTokens = maxTokens;
        this.tokensPerChar = tokensPerChar; // Estimación: ~4 chars por token
        this.chunker = new ContextChunker();
    }
    /**
     * Optimiza contextos para un mensaje específico
     */
    async optimize(contexts, userMessage) {
        if (!contexts || contexts.length === 0) {
            return '';
        }
        // 1. Convertir contextos a chunks
        const allChunks = this.chunker.processContexts(contexts);
        if (allChunks.length === 0) {
            return '';
        }
        // 2. Seleccionar chunks más relevantes
        const relevantChunks = this.chunker.selectRelevant(allChunks, userMessage, Math.min(8, allChunks.length) // Máximo 8 chunks para evaluar
        );
        // 3. Construir contexto optimizado respetando límite de tokens
        let optimizedContext = '';
        let currentTokens = 0;
        for (const chunk of relevantChunks) {
            const chunkTokens = this.estimateTokens(chunk.content);
            if (currentTokens + chunkTokens > this.maxTokens) {
                // Si es el primer chunk y es demasiado grande, truncar
                if (optimizedContext === '') {
                    const truncatedContent = this.truncateToTokens(chunk.content, this.maxTokens - 100);
                    optimizedContext += this.formatChunk(truncatedContent, chunk.source);
                }
                break;
            }
            optimizedContext += this.formatChunk(chunk.content, chunk.source);
            currentTokens += chunkTokens;
            // Añadir separador entre chunks
            optimizedContext += '\n---\n';
            currentTokens += 10; // Tokens del separador
        }
        // 4. Añadir resumen si el contexto es muy largo
        if (currentTokens > this.maxTokens * 0.8) {
            optimizedContext = this.addContextSummary(optimizedContext, userMessage);
        }
        return optimizedContext.trim();
    }
    /**
     * Estima tokens de un texto
     */
    estimateTokens(text) {
        if (!text)
            return 0;
        return Math.ceil(text.length * this.tokensPerChar);
    }
    /**
     * Trunca texto para que no exceda un límite de tokens
     */
    truncateToTokens(text, maxTokens) {
        const maxChars = Math.floor(maxTokens / this.tokensPerChar);
        if (text.length <= maxChars) {
            return text;
        }
        // Truncar en el último punto antes del límite
        let truncated = text.substring(0, maxChars);
        const lastDot = truncated.lastIndexOf('.');
        if (lastDot > maxChars * 0.7) { // Solo si el punto está en el último 30%
            truncated = truncated.substring(0, lastDot + 1);
        }
        return truncated + '\n\n[...contenido truncado por límite de tokens...]';
    }
    /**
     * Formatea un chunk con su fuente
     */
    formatChunk(content, source) {
        if (source) {
            return `## ${source}\n\n${content}\n\n`;
        }
        return `${content}\n\n`;
    }
    /**
     * Añade un resumen del contexto si es muy largo
     */
    addContextSummary(context, userMessage) {
        const summary = this.generateContextSummary(context, userMessage);
        return `## RESUMEN DEL CONTEXTO
${summary}

## CONTEXTO DETALLADO
${context}`;
    }
    /**
     * Genera un resumen básico del contexto (sin LLM)
     */
    generateContextSummary(context, userMessage) {
        const queryKeywords = this.chunker.extractKeywords(userMessage);
        const contextKeywords = this.chunker.extractKeywords(context);
        // Encontrar keywords más relevantes
        const relevantKeywords = contextKeywords
            .filter(kw => queryKeywords.some(qkw => kw.includes(qkw) || qkw.includes(kw)))
            .slice(0, 5);
        // Extraer primeras oraciones de cada sección
        const sections = context.split('## ').filter(s => s.trim().length > 0);
        const summaryParts = [];
        for (const section of sections.slice(0, 3)) { // Máximo 3 secciones
            const lines = section.split('\n').filter(l => l.trim().length > 0);
            if (lines.length > 0) {
                const title = lines[0];
                const firstSentence = this.extractFirstSentence(lines.slice(1).join(' '));
                if (firstSentence) {
                    summaryParts.push(`- **${title}**: ${firstSentence}`);
                }
            }
        }
        let summary = `Este contexto incluye información sobre: ${relevantKeywords.join(', ')}.`;
        if (summaryParts.length > 0) {
            summary += `\n\n${summaryParts.join('\n')}`;
        }
        return summary;
    }
    /**
     * Extrae la primera oración de un texto
     */
    extractFirstSentence(text) {
        const sentences = text.split(/[.!?]/);
        const firstSentence = sentences[0]?.trim();
        if (firstSentence && firstSentence.length > 10) {
            return firstSentence + '.';
        }
        // Si no hay punto, tomar los primeros 100 caracteres
        return text.substring(0, 100).trim() + (text.length > 100 ? '...' : '');
    }
    /**
     * Detecta si el contexto necesita optimización
     */
    shouldOptimize(contexts) {
        const totalSize = contexts.reduce((sum, ctx) => sum + (ctx.sizeKB || 0), 0);
        return totalSize > 10; // Si es más de 10KB, optimizar
    }
    /**
     * Obtiene estadísticas del contexto optimizado
     */
    getOptimizationStats(original, optimized) {
        const originalContent = original
            .map(ctx => ctx.content || ctx.title || '')
            .join('\n');
        const originalTokens = this.estimateTokens(originalContent);
        const optimizedTokens = this.estimateTokens(optimized);
        const reduction = Math.round((1 - optimizedTokens / originalTokens) * 100);
        const chunksUsed = (optimized.match(/---/g) || []).length;
        return {
            originalTokens,
            optimizedTokens,
            reduction,
            chunksUsed
        };
    }
    /**
     * Prioriza contextos por relevancia y frecuencia de uso
     */
    prioritizeContexts(contexts, userMessage) {
        const queryKeywords = this.chunker.extractKeywords(userMessage);
        return contexts
            .map(ctx => {
            const content = ctx.content || ctx.title || '';
            const contextKeywords = this.chunker.extractKeywords(content);
            // Calcular score de relevancia
            const relevanceScore = this.calculateContextRelevance(contextKeywords, queryKeywords, content, userMessage);
            // Priorizar contextos de preguntas (más específicos)
            const typeBonus = ctx.type === 'QUESTION' ? 1.5 : 1;
            // Priorizar contextos más recientes (si tienen fecha)
            const recencyBonus = 1; // TODO: implementar si hay timestamps
            return {
                ...ctx,
                priority: relevanceScore * typeBonus * recencyBonus
            };
        })
            .sort((a, b) => b.priority - a.priority);
    }
    /**
     * Calcula relevancia de un contexto para la query
     */
    calculateContextRelevance(contextKeywords, queryKeywords, content, query) {
        let score = 0;
        // Palabras en común
        const commonWords = contextKeywords.filter(kw => queryKeywords.some(qkw => kw.includes(qkw) || qkw.includes(kw)));
        score += commonWords.length * 2;
        // Menciones exactas
        const exactMatches = (content.toLowerCase().match(new RegExp(query.toLowerCase(), 'gi')) || []).length;
        score += exactMatches * 3;
        return score;
    }
}
