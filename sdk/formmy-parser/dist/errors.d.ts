/**
 * Custom Error Classes for Formmy Parser SDK
 * Provides specific error types for better error handling
 */
export declare class FormmyParserError extends Error {
    readonly statusCode?: number;
    readonly response?: any;
    constructor(message: string, statusCode?: number, response?: any);
}
export declare class AuthenticationError extends FormmyParserError {
    constructor(message?: string);
}
export declare class InsufficientCreditsError extends FormmyParserError {
    readonly creditsRequired: number;
    readonly creditsAvailable: number;
    constructor(required: number, available: number);
}
export declare class RateLimitError extends FormmyParserError {
    readonly retryAfter?: number;
    constructor(message?: string, retryAfter?: number);
}
export declare class ValidationError extends FormmyParserError {
    constructor(message: string);
}
export declare class JobNotFoundError extends FormmyParserError {
    constructor(jobId: string);
}
export declare class ParsingFailedError extends FormmyParserError {
    readonly jobId: string;
    constructor(jobId: string, reason?: string);
}
export declare class TimeoutError extends FormmyParserError {
    readonly jobId: string;
    readonly timeoutMs: number;
    constructor(jobId: string, timeoutMs: number);
}
export declare class NetworkError extends FormmyParserError {
    readonly originalError: Error;
    constructor(originalError: Error);
}
/**
 * Parse error response and throw appropriate custom error
 */
export declare function handleErrorResponse(status: number, responseBody: any, responseText: string): never;
//# sourceMappingURL=errors.d.ts.map