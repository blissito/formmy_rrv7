/**
 * Type Definitions and Runtime Validators for Formmy Parser SDK
 */
export type ParsingMode = 'DEFAULT' | 'COST_EFFECTIVE' | 'AGENTIC' | 'AGENTIC_PLUS';
export type JobStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
export type QueryMode = 'fast' | 'accurate';
export interface ParserConfig {
    apiKey: string;
    baseUrl?: string;
    debug?: boolean;
    timeout?: number;
    retries?: number;
}
export interface ParsingJob {
    id: string;
    status: JobStatus;
    fileName: string;
    mode: ParsingMode;
    creditsUsed: number;
    markdown?: string;
    pages?: number;
    processingTime?: number;
    error?: string;
    createdAt: string;
    completedAt?: string;
}
export interface WaitForOptions {
    pollInterval?: number;
    timeout?: number;
    onProgress?: (job: ParsingJob) => void;
}
export interface RAGQueryOptions {
    mode?: QueryMode;
    contextId?: string;
}
export interface RAGSource {
    content: string;
    score: number;
    metadata: {
        fileName?: string;
        page?: number;
        chunkIndex?: number;
    };
}
export interface RAGQueryResult {
    query: string;
    answer?: string;
    results?: RAGSource[];
    sources?: RAGSource[];
    creditsUsed: number;
    processingTime: number;
}
export declare function isParsingMode(value: any): value is ParsingMode;
export declare function isJobStatus(value: any): value is JobStatus;
export declare function isQueryMode(value: any): value is QueryMode;
export declare function isParsingJob(value: any): value is ParsingJob;
export declare function isRAGQueryResult(value: any): value is RAGQueryResult;
export declare function validateApiKey(apiKey: string): void;
export declare function validateParsingMode(mode: any): asserts mode is ParsingMode;
export declare function validateQueryMode(mode: any): asserts mode is QueryMode;
export declare function validateJobId(jobId: any): asserts jobId is string;
export declare function validateChatbotId(chatbotId: any): asserts chatbotId is string;
export declare function validateQuery(query: any): asserts query is string;
/**
 * Validate and parse API response as ParsingJob
 */
export declare function validateParsingJobResponse(data: any): ParsingJob;
/**
 * Validate and parse API response as RAGQueryResult
 */
export declare function validateRAGQueryResponse(data: any): RAGQueryResult;
//# sourceMappingURL=types.d.ts.map