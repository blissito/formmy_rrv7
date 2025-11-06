/**
 * Formmy SDK Client
 * RAG as a Service - Upload documents, query knowledge base
 *
 * We handle: parsing, chunking, embeddings, vector storage, semantic search
 * You handle: upload docs → query → get answers
 */
import { validateApiKey, validateParsingMode, validateQueryMode, validateJobId, validateChatbotId, validateQuery, validateParsingJobResponse, validateRAGQueryResponse, } from './types.js';
import { handleErrorResponse, NetworkError, TimeoutError, ParsingFailedError, ValidationError, } from './errors.js';
// ============ HELPERS ============
/**
 * Check if running in Node.js environment
 */
const isNode = typeof process !== 'undefined' &&
    process.versions != null &&
    process.versions.node != null;
/**
 * Sleep utility for retry logic
 */
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
/**
 * Exponential backoff calculator
 */
function getBackoffDelay(attempt, baseDelay = 1000) {
    return Math.min(baseDelay * Math.pow(2, attempt), 10000);
}
/**
 * Retry wrapper with exponential backoff
 */
async function withRetry(fn, options) {
    const { retries, onRetry, shouldRetry } = options;
    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            return await fn();
        }
        catch (error) {
            const isLastAttempt = attempt === retries;
            const canRetry = shouldRetry ? shouldRetry(error) : true;
            if (isLastAttempt || !canRetry) {
                throw error;
            }
            const delay = getBackoffDelay(attempt);
            if (onRetry) {
                onRetry(attempt + 1, error);
            }
            await sleep(delay);
        }
    }
    throw new Error('Retry logic failed unexpectedly');
}
/**
 * Create FormData compatible with both Node and Browser
 */
async function createFormData(file, mode) {
    const formData = new FormData();
    if (isNode && typeof file === 'string') {
        // Node.js: Import fs dynamically
        const fs = await import('fs');
        const path = await import('path');
        const filePath = path.resolve(file);
        const fileBuffer = fs.readFileSync(filePath);
        const fileName = path.basename(filePath);
        const blob = new Blob([new Uint8Array(fileBuffer)]);
        formData.append('file', blob, fileName);
    }
    else if (file instanceof Buffer) {
        // Node.js: Buffer
        const blob = new Blob([new Uint8Array(file)]);
        formData.append('file', blob, 'document.pdf');
    }
    else if (file instanceof Blob) {
        // Browser: Blob or File
        formData.append('file', file);
    }
    else {
        throw new Error('Invalid file type. Expected string path, Buffer, or Blob');
    }
    formData.append('mode', mode);
    return formData;
}
// ============ CLIENT ============
export class Formmy {
    constructor(config) {
        if (typeof config === 'string') {
            this.apiKey = config;
            this.baseUrl = 'https://formmy.app';
            this.debug = false;
            this.timeout = 30000;
            this.retries = 3;
        }
        else {
            this.apiKey = config.apiKey;
            this.baseUrl = config.baseUrl || 'https://formmy.app';
            this.debug = config.debug || false;
            this.timeout = config.timeout || 30000;
            this.retries = config.retries || 3;
        }
        validateApiKey(this.apiKey);
    }
    /**
     * Internal fetch wrapper with timeout and error handling
     */
    async fetch(url, options = {}) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);
        try {
            if (this.debug) {
                console.log(`[FormmyParser] ${options.method || 'GET'} ${url}`);
            }
            const response = await fetch(url, {
                ...options,
                signal: controller.signal,
            });
            clearTimeout(timeoutId);
            return response;
        }
        catch (error) {
            clearTimeout(timeoutId);
            if (error.name === 'AbortError') {
                throw new NetworkError(new Error(`Request timeout after ${this.timeout}ms`));
            }
            throw new NetworkError(error);
        }
    }
    /**
     * Handle API response and parse JSON with error handling
     */
    async handleResponse(response, validator) {
        const responseText = await response.text();
        if (this.debug) {
            console.log(`[FormmyParser] Response ${response.status}: ${responseText.substring(0, 200)}`);
        }
        if (!response.ok) {
            let responseBody = responseText;
            try {
                responseBody = JSON.parse(responseText);
            }
            catch {
                // Keep as text
            }
            handleErrorResponse(response.status, responseBody, responseText);
        }
        const data = JSON.parse(responseText);
        return validator ? validator(data) : data;
    }
    /**
     * Parse a document (PDF, DOCX, etc.)
     *
     * @param file - File path (Node.js), Buffer, or Blob
     * @param mode - Parsing mode: COST_EFFECTIVE, AGENTIC, or AGENTIC_PLUS
     * @returns ParsingJob with job ID and initial status
     *
     * @example
     * ```typescript
     * // Node.js
     * const job = await parser.parse('./document.pdf', 'AGENTIC');
     *
     * // Browser
     * const file = document.querySelector('input[type="file"]').files[0];
     * const job = await parser.parse(file, 'AGENTIC');
     * ```
     */
    async parse(file, mode = 'AGENTIC') {
        validateParsingMode(mode);
        const formData = await createFormData(file, mode);
        return withRetry(async () => {
            const response = await this.fetch(`${this.baseUrl}/api/parser/v1?intent=upload`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${this.apiKey}`,
                },
                body: formData,
            });
            return this.handleResponse(response, validateParsingJobResponse);
        }, {
            retries: this.retries,
            onRetry: (attempt, error) => {
                if (this.debug) {
                    console.log(`[FormmyParser] Retry ${attempt}/${this.retries}: ${error.message}`);
                }
            },
            shouldRetry: (error) => {
                // Retry on network errors and 5xx, but not on 4xx (client errors)
                if (error instanceof NetworkError)
                    return true;
                if (error.statusCode && error.statusCode >= 500)
                    return true;
                return false;
            },
        });
    }
    /**
     * Get the status of a parsing job
     *
     * @param jobId - The job ID returned from parse()
     * @returns Current ParsingJob status
     *
     * @example
     * ```typescript
     * const status = await parser.getStatus('job_abc123');
     * console.log(status.status); // PENDING | PROCESSING | COMPLETED | FAILED
     * ```
     */
    async getStatus(jobId) {
        validateJobId(jobId);
        return withRetry(async () => {
            const response = await this.fetch(`${this.baseUrl}/api/parser/v1?intent=status&jobId=${encodeURIComponent(jobId)}`, {
                headers: {
                    Authorization: `Bearer ${this.apiKey}`,
                },
            });
            return this.handleResponse(response, validateParsingJobResponse);
        }, {
            retries: this.retries,
            onRetry: (attempt, error) => {
                if (this.debug) {
                    console.log(`[FormmyParser] Retry ${attempt}/${this.retries}: ${error.message}`);
                }
            },
            shouldRetry: (error) => {
                if (error instanceof NetworkError)
                    return true;
                if (error.statusCode && error.statusCode >= 500)
                    return true;
                return false;
            },
        });
    }
    /**
     * Wait for a job to complete with polling
     *
     * @param jobId - The job ID returned from parse()
     * @param options - Polling configuration
     * @returns Completed ParsingJob with markdown content
     *
     * @example
     * ```typescript
     * const result = await parser.waitFor('job_abc123', {
     *   pollInterval: 2000,
     *   timeout: 300000,
     *   onProgress: (job) => console.log(`Status: ${job.status}`)
     * });
     * console.log(result.markdown);
     * ```
     */
    async waitFor(jobId, options = {}) {
        validateJobId(jobId);
        const pollInterval = options.pollInterval || 2000;
        const timeout = options.timeout || 300000;
        const startTime = Date.now();
        while (Date.now() - startTime < timeout) {
            const job = await this.getStatus(jobId);
            // Progress callback
            if (options.onProgress) {
                options.onProgress(job);
            }
            // Completed successfully
            if (job.status === 'COMPLETED') {
                return job;
            }
            // Failed
            if (job.status === 'FAILED') {
                throw new ParsingFailedError(jobId, job.error);
            }
            // Continue waiting
            await sleep(pollInterval);
        }
        throw new TimeoutError(jobId, timeout);
    }
    /**
     * Query RAG - Semantic search in knowledge base
     *
     * @param query - Search query
     * @param chatbotId - Chatbot ID to search in
     * @param options - Query configuration
     * @returns RAG query result with answer and sources
     *
     * @example
     * ```typescript
     * const result = await parser.query(
     *   '¿Cuál es el horario de atención?',
     *   'chatbot_123',
     *   { mode: 'accurate' }
     * );
     * console.log(result.answer);
     * console.log(result.sources);
     * ```
     */
    async query(query, chatbotId, options = {}) {
        validateQuery(query);
        validateChatbotId(chatbotId);
        const { mode = 'accurate', contextId } = options;
        validateQueryMode(mode);
        return withRetry(async () => {
            const response = await this.fetch(`${this.baseUrl}/api/v1/rag?intent=query`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    query,
                    chatbotId,
                    contextId,
                    mode,
                }),
            });
            return this.handleResponse(response, validateRAGQueryResponse);
        }, {
            retries: this.retries,
            onRetry: (attempt, error) => {
                if (this.debug) {
                    console.log(`[FormmyParser] Retry ${attempt}/${this.retries}: ${error.message}`);
                }
            },
            shouldRetry: (error) => {
                if (error instanceof NetworkError)
                    return true;
                if (error.statusCode && error.statusCode >= 500)
                    return true;
                return false;
            },
        });
    }
    /**
     * List all contexts (documents) in a chatbot's knowledge base
     *
     * @param chatbotId - The chatbot ID to list contexts from
     * @returns List of contexts with metadata
     *
     * @example
     * ```typescript
     * const contexts = await formmy.listContexts('chatbot_123');
     * console.log(`Total: ${contexts.totalContexts}`);
     * console.log(contexts.contexts); // Array of documents
     * ```
     */
    async listContexts(chatbotId) {
        validateChatbotId(chatbotId);
        return withRetry(async () => {
            const response = await this.fetch(`${this.baseUrl}/api/v1/rag?intent=list&chatbotId=${encodeURIComponent(chatbotId)}`, {
                headers: {
                    Authorization: `Bearer ${this.apiKey}`,
                },
            });
            return this.handleResponse(response);
        }, {
            retries: this.retries,
            onRetry: (attempt, error) => {
                if (this.debug) {
                    console.log(`[Formmy] Retry ${attempt}/${this.retries}: ${error.message}`);
                }
            },
            shouldRetry: (error) => {
                if (error instanceof NetworkError)
                    return true;
                if (error.statusCode && error.statusCode >= 500)
                    return true;
                return false;
            },
        });
    }
    /**
     * Upload text content directly to knowledge base
     *
     * @param content - Text content to upload
     * @param options - Upload options including chatbotId and metadata
     * @returns Upload result with contextId and credits used
     *
     * @example
     * ```typescript
     * await formmy.uploadText('Horarios: Lun-Vie 9am-6pm', {
     *   chatbotId: 'chatbot_123',
     *   metadata: { title: 'Horarios de atención' }
     * });
     * ```
     */
    async uploadText(content, options) {
        validateChatbotId(options.chatbotId);
        if (!content || typeof content !== 'string') {
            throw new ValidationError('Content is required and must be a string');
        }
        return withRetry(async () => {
            const response = await this.fetch(`${this.baseUrl}/api/v1/rag?intent=upload`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    chatbotId: options.chatbotId,
                    content,
                    type: options.metadata?.type || 'TEXT',
                    metadata: options.metadata,
                }),
            });
            return this.handleResponse(response);
        }, {
            retries: this.retries,
            onRetry: (attempt, error) => {
                if (this.debug) {
                    console.log(`[Formmy] Retry ${attempt}/${this.retries}: ${error.message}`);
                }
            },
            shouldRetry: (error) => {
                if (error instanceof NetworkError)
                    return true;
                if (error.statusCode && error.statusCode >= 500)
                    return true;
                return false;
            },
        });
    }
    /**
     * Delete a context from the knowledge base
     *
     * @param contextId - The context ID to delete
     * @param chatbotId - The chatbot ID that owns the context
     *
     * @example
     * ```typescript
     * await formmy.deleteContext('ctx_xyz789', 'chatbot_123');
     * ```
     */
    async deleteContext(contextId, chatbotId) {
        if (!contextId || typeof contextId !== 'string') {
            throw new ValidationError('Context ID is required and must be a string');
        }
        validateChatbotId(chatbotId);
        return withRetry(async () => {
            const response = await this.fetch(`${this.baseUrl}/api/v1/rag?intent=delete&contextId=${encodeURIComponent(contextId)}&chatbotId=${encodeURIComponent(chatbotId)}`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${this.apiKey}`,
                },
            });
            return this.handleResponse(response);
        }, {
            retries: this.retries,
            onRetry: (attempt, error) => {
                if (this.debug) {
                    console.log(`[Formmy] Retry ${attempt}/${this.retries}: ${error.message}`);
                }
            },
            shouldRetry: (error) => {
                if (error instanceof NetworkError)
                    return true;
                if (error.statusCode && error.statusCode >= 500)
                    return true;
                return false;
            },
        });
    }
}
// Export alias for backward compatibility
export { Formmy as FormmyParser };
//# sourceMappingURL=client.js.map