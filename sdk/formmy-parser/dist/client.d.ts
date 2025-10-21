/**
 * Formmy Parser SDK Client
 * Production-ready TypeScript client with retry logic, error handling, and dual environment support
 */
import { type ParserConfig, type ParsingJob, type ParsingMode, type RAGQueryOptions, type RAGQueryResult, type WaitForOptions } from './types';
export declare class FormmyParser {
    private apiKey;
    private baseUrl;
    private debug;
    private timeout;
    private retries;
    constructor(config: ParserConfig | string);
    /**
     * Internal fetch wrapper with timeout and error handling
     */
    private fetch;
    /**
     * Handle API response and parse JSON with error handling
     */
    private handleResponse;
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
    parse(file: string | Buffer | Blob, mode?: ParsingMode): Promise<ParsingJob>;
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
    getStatus(jobId: string): Promise<ParsingJob>;
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
    waitFor(jobId: string, options?: WaitForOptions): Promise<ParsingJob>;
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
    query(query: string, chatbotId: string, options?: RAGQueryOptions): Promise<RAGQueryResult>;
}
//# sourceMappingURL=client.d.ts.map