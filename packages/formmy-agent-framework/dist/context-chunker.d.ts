/**
 * Context Chunker: División inteligente de contexto sin embeddings
 */
import type { ContextItem, ContextChunk } from './types';
export declare class ContextChunker {
    private readonly chunkSize;
    private readonly overlapSize;
    constructor(chunkSize?: number, overlapSize?: number);
    /**
     * Divide un texto en chunks inteligentes
     */
    chunk(text: string, source?: string): ContextChunk[];
    /**
     * Selecciona chunks relevantes basado en keywords (sin embeddings)
     */
    selectRelevant(chunks: ContextChunk[], query: string, limit?: number): ContextChunk[];
    /**
     * Procesa contextos completos de un chatbot
     */
    processContexts(contexts: ContextItem[]): ContextChunk[];
    /**
     * Divide texto en párrafos inteligentemente
     */
    private splitIntoParagraphs;
    /**
     * Divide texto largo por oraciones
     */
    private splitBySentences;
    /**
     * Crea un chunk con metadata
     */
    private createChunk;
    /**
     * Obtiene texto de overlap del final de un chunk
     */
    private getOverlapText;
    /**
     * Extrae keywords relevantes de un texto
     */
    extractKeywords(text: string): string[];
    /**
     * Calcula relevancia basada en keywords y contenido
     */
    private calculateKeywordRelevance;
    /**
     * Calcula similitud básica entre dos strings
     */
    private levenshteinSimilarity;
    /**
     * Distancia de Levenshtein simplificada
     */
    private levenshteinDistance;
}
//# sourceMappingURL=context-chunker.d.ts.map