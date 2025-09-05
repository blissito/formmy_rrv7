/**
 * Context Chunker: División inteligente de contexto sin embeddings
 */
export class ContextChunker {
    constructor(chunkSize = 1000, overlapSize = 100) {
        this.chunkSize = chunkSize;
        this.overlapSize = overlapSize;
    }
    /**
     * Divide un texto en chunks inteligentes
     */
    chunk(text, source) {
        if (!text || text.trim().length === 0) {
            return [];
        }
        const chunks = [];
        const paragraphs = this.splitIntoParagraphs(text);
        let currentChunk = '';
        for (const paragraph of paragraphs) {
            // Si el párrafo solo excede el tamaño, añadir chunk actual y empezar nuevo
            if (currentChunk.length + paragraph.length > this.chunkSize && currentChunk.length > 0) {
                chunks.push(this.createChunk(currentChunk, source));
                // Mantener overlap con las últimas oraciones del chunk anterior
                currentChunk = this.getOverlapText(currentChunk) + paragraph;
            }
            else {
                currentChunk += (currentChunk.length > 0 ? '\n\n' : '') + paragraph;
            }
        }
        // Añadir el último chunk si no está vacío
        if (currentChunk.trim().length > 0) {
            chunks.push(this.createChunk(currentChunk, source));
        }
        return chunks;
    }
    /**
     * Selecciona chunks relevantes basado en keywords (sin embeddings)
     */
    selectRelevant(chunks, query, limit = 3) {
        const queryKeywords = this.extractKeywords(query);
        return chunks
            .map(chunk => ({
            ...chunk,
            relevanceScore: this.calculateKeywordRelevance(chunk.keywords, queryKeywords, chunk.content, query)
        }))
            .sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0))
            .slice(0, limit);
    }
    /**
     * Procesa contextos completos de un chatbot
     */
    processContexts(contexts) {
        const allChunks = [];
        for (const context of contexts) {
            let content = '';
            // Construir contenido según el tipo
            switch (context.type) {
                case 'TEXT':
                    content = context.content || '';
                    break;
                case 'QUESTION':
                    content = `${context.title}\n\nPreguntas: ${context.questions}\n\nRespuesta: ${context.answer}`;
                    break;
                case 'FILE':
                case 'LINK':
                    content = context.content || context.title || '';
                    break;
            }
            if (content.trim()) {
                const chunks = this.chunk(content, context.title || context.id);
                allChunks.push(...chunks);
            }
        }
        return allChunks;
    }
    /**
     * Divide texto en párrafos inteligentemente
     */
    splitIntoParagraphs(text) {
        // Dividir por dobles saltos de línea, pero mantener estructura
        let paragraphs = text.split(/\n\s*\n/);
        // Si no hay párrafos, dividir por saltos de línea simples
        if (paragraphs.length === 1) {
            paragraphs = text.split('\n').filter(p => p.trim().length > 0);
        }
        // Si aún es un solo párrafo muy largo, dividir por oraciones
        if (paragraphs.length === 1 && paragraphs[0].length > this.chunkSize) {
            paragraphs = this.splitBySentences(paragraphs[0]);
        }
        return paragraphs.filter(p => p.trim().length > 0);
    }
    /**
     * Divide texto largo por oraciones
     */
    splitBySentences(text) {
        // Expresión regular para detectar fin de oración
        const sentences = text.split(/(?<=[.!?])\s+/);
        const paragraphs = [];
        let currentPara = '';
        for (const sentence of sentences) {
            if (currentPara.length + sentence.length > this.chunkSize && currentPara.length > 0) {
                paragraphs.push(currentPara.trim());
                currentPara = sentence;
            }
            else {
                currentPara += (currentPara.length > 0 ? ' ' : '') + sentence;
            }
        }
        if (currentPara.trim().length > 0) {
            paragraphs.push(currentPara.trim());
        }
        return paragraphs;
    }
    /**
     * Crea un chunk con metadata
     */
    createChunk(content, source) {
        return {
            content: content.trim(),
            keywords: this.extractKeywords(content),
            source
        };
    }
    /**
     * Obtiene texto de overlap del final de un chunk
     */
    getOverlapText(text) {
        if (text.length <= this.overlapSize) {
            return text + '\n\n';
        }
        // Buscar el último punto en los últimos overlapSize caracteres
        const overlapText = text.slice(-this.overlapSize);
        const lastDot = overlapText.lastIndexOf('.');
        if (lastDot > -1) {
            return text.slice(-(this.overlapSize - lastDot)) + '\n\n';
        }
        return overlapText + '\n\n';
    }
    /**
     * Extrae keywords relevantes de un texto
     */
    extractKeywords(text) {
        if (!text)
            return [];
        const cleanText = text.toLowerCase()
            .replace(/[^\w\sáéíóúñü]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
        const words = cleanText.split(' ');
        // Filtrar palabras vacías en español
        const stopWords = new Set([
            'el', 'la', 'de', 'que', 'y', 'a', 'en', 'un', 'es', 'se', 'no', 'te', 'lo', 'le',
            'da', 'su', 'por', 'son', 'con', 'del', 'las', 'al', 'una', 'sur', 'también', 'fue',
            'era', 'muy', 'años', 'hasta', 'desde', 'está', 'han', 'donde', 'quien', 'pero',
            'más', 'este', 'ya', 'todo', 'está', 'todos', 'puede', 'ser', 'tiene', 'más',
            'para', 'como', 'cuando', 'sobre', 'entre', 'sin', 'me', 'mi', 'tu', 'sus'
        ]);
        const keywords = words
            .filter(word => word.length > 2)
            .filter(word => !stopWords.has(word))
            .filter(word => !word.match(/^\d+$/)) // No números solos
            .slice(0, 10); // Máximo 10 keywords por chunk
        // Eliminar duplicados y retornar
        return Array.from(new Set(keywords));
    }
    /**
     * Calcula relevancia basada en keywords y contenido
     */
    calculateKeywordRelevance(chunkKeywords, queryKeywords, content, query) {
        let score = 0;
        // Puntuación por keywords en común
        const commonKeywords = chunkKeywords.filter(kw => queryKeywords.some(qkw => qkw.includes(kw) || kw.includes(qkw) || this.levenshteinSimilarity(kw, qkw) > 0.8));
        score += commonKeywords.length * 2;
        // Puntuación por menciones exactas de la query
        const queryLower = query.toLowerCase();
        const contentLower = content.toLowerCase();
        const exactMatches = (contentLower.match(new RegExp(queryLower, 'gi')) || []).length;
        score += exactMatches * 3;
        // Puntuación por palabras de la query en el contenido
        for (const qword of queryKeywords) {
            if (contentLower.includes(qword)) {
                score += 1;
            }
        }
        // Normalizar por longitud del contenido
        return score / Math.log(content.length + 1);
    }
    /**
     * Calcula similitud básica entre dos strings
     */
    levenshteinSimilarity(str1, str2) {
        const maxLen = Math.max(str1.length, str2.length);
        if (maxLen === 0)
            return 1;
        return 1 - this.levenshteinDistance(str1, str2) / maxLen;
    }
    /**
     * Distancia de Levenshtein simplificada
     */
    levenshteinDistance(str1, str2) {
        const matrix = [];
        for (let i = 0; i <= str2.length; i++) {
            matrix[i] = [i];
        }
        for (let j = 0; j <= str1.length; j++) {
            matrix[0][j] = j;
        }
        for (let i = 1; i <= str2.length; i++) {
            for (let j = 1; j <= str1.length; j++) {
                if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                }
                else {
                    matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1);
                }
            }
        }
        return matrix[str2.length][str1.length];
    }
}
