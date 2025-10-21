/**
 * Custom Error Classes for Formmy Parser SDK
 * Provides specific error types for better error handling
 */
export class FormmyParserError extends Error {
    constructor(message, statusCode, response) {
        super(message);
        this.name = 'FormmyParserError';
        this.statusCode = statusCode;
        this.response = response;
        // Maintains proper stack trace for where our error was thrown (only available on V8)
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, FormmyParserError);
        }
    }
}
export class AuthenticationError extends FormmyParserError {
    constructor(message = 'Invalid API key') {
        super(message, 401);
        this.name = 'AuthenticationError';
    }
}
export class InsufficientCreditsError extends FormmyParserError {
    constructor(required, available) {
        super(`Insufficient credits: ${available} available, ${required} required`, 402);
        this.name = 'InsufficientCreditsError';
        this.creditsRequired = required;
        this.creditsAvailable = available;
    }
}
export class RateLimitError extends FormmyParserError {
    constructor(message = 'Rate limit exceeded', retryAfter) {
        super(message, 429);
        this.name = 'RateLimitError';
        this.retryAfter = retryAfter;
    }
}
export class ValidationError extends FormmyParserError {
    constructor(message) {
        super(message, 400);
        this.name = 'ValidationError';
    }
}
export class JobNotFoundError extends FormmyParserError {
    constructor(jobId) {
        super(`Job not found: ${jobId}`, 404);
        this.name = 'JobNotFoundError';
    }
}
export class ParsingFailedError extends FormmyParserError {
    constructor(jobId, reason) {
        super(`Parsing failed for job ${jobId}${reason ? `: ${reason}` : ''}`, 500);
        this.name = 'ParsingFailedError';
        this.jobId = jobId;
    }
}
export class TimeoutError extends FormmyParserError {
    constructor(jobId, timeoutMs) {
        super(`Timeout waiting for job ${jobId} after ${timeoutMs}ms`, 408);
        this.name = 'TimeoutError';
        this.jobId = jobId;
        this.timeoutMs = timeoutMs;
    }
}
export class NetworkError extends FormmyParserError {
    constructor(originalError) {
        super(`Network error: ${originalError.message}`, 0);
        this.name = 'NetworkError';
        this.originalError = originalError;
    }
}
/**
 * Parse error response and throw appropriate custom error
 */
export function handleErrorResponse(status, responseBody, responseText) {
    // Try to extract error message
    let errorMessage;
    try {
        const parsed = typeof responseBody === 'string' ? JSON.parse(responseBody) : responseBody;
        errorMessage = parsed.error || parsed.message || responseText.substring(0, 300);
    }
    catch {
        errorMessage = responseText.substring(0, 300);
    }
    // Throw specific errors based on status code
    switch (status) {
        case 401:
        case 403:
            throw new AuthenticationError(errorMessage);
        case 402:
            // Try to extract credits info
            const match = errorMessage.match(/(\d+) available, (\d+) required/);
            if (match) {
                throw new InsufficientCreditsError(parseInt(match[2], 10), parseInt(match[1], 10));
            }
            throw new InsufficientCreditsError(0, 0);
        case 404:
            throw new JobNotFoundError(errorMessage);
        case 429:
            // Try to extract retry-after header
            throw new RateLimitError(errorMessage);
        case 400:
            throw new ValidationError(errorMessage);
        default:
            throw new FormmyParserError(errorMessage, status, responseBody);
    }
}
//# sourceMappingURL=errors.js.map