/**
 * Type Definitions and Runtime Validators for Formmy Parser SDK
 */
import { ValidationError } from './errors';
// ============ TYPE GUARDS ============
export function isParsingMode(value) {
    return (typeof value === 'string' &&
        ['DEFAULT', 'COST_EFFECTIVE', 'AGENTIC', 'AGENTIC_PLUS'].includes(value));
}
export function isJobStatus(value) {
    return (typeof value === 'string' &&
        ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'].includes(value));
}
export function isQueryMode(value) {
    return typeof value === 'string' && ['fast', 'accurate'].includes(value);
}
export function isParsingJob(value) {
    return (typeof value === 'object' &&
        value !== null &&
        typeof value.id === 'string' &&
        isJobStatus(value.status) &&
        typeof value.fileName === 'string' &&
        isParsingMode(value.mode) &&
        typeof value.creditsUsed === 'number' &&
        typeof value.createdAt === 'string');
}
export function isRAGQueryResult(value) {
    return (typeof value === 'object' &&
        value !== null &&
        typeof value.query === 'string' &&
        typeof value.creditsUsed === 'number' &&
        typeof value.processingTime === 'number');
}
// ============ VALIDATORS ============
export function validateApiKey(apiKey) {
    if (!apiKey || typeof apiKey !== 'string') {
        throw new ValidationError('API key is required');
    }
    if (!apiKey.startsWith('sk_live_') && !apiKey.startsWith('sk_test_')) {
        throw new ValidationError('Invalid API key format. Must start with sk_live_ or sk_test_');
    }
}
export function validateParsingMode(mode) {
    if (!isParsingMode(mode)) {
        throw new ValidationError(`Invalid parsing mode: ${mode}. Must be one of: DEFAULT, COST_EFFECTIVE, AGENTIC, AGENTIC_PLUS`);
    }
}
export function validateQueryMode(mode) {
    if (!isQueryMode(mode)) {
        throw new ValidationError(`Invalid query mode: ${mode}. Must be one of: fast, accurate`);
    }
}
export function validateJobId(jobId) {
    if (!jobId || typeof jobId !== 'string') {
        throw new ValidationError('Job ID is required and must be a string');
    }
}
export function validateChatbotId(chatbotId) {
    if (!chatbotId || typeof chatbotId !== 'string') {
        throw new ValidationError('Chatbot ID is required and must be a string');
    }
}
export function validateQuery(query) {
    if (!query || typeof query !== 'string') {
        throw new ValidationError('Query is required and must be a string');
    }
    if (query.length < 3) {
        throw new ValidationError('Query must be at least 3 characters long');
    }
}
/**
 * Validate and parse API response as ParsingJob
 */
export function validateParsingJobResponse(data) {
    if (!isParsingJob(data)) {
        throw new ValidationError('Invalid ParsingJob response from API');
    }
    return data;
}
/**
 * Validate and parse API response as RAGQueryResult
 */
export function validateRAGQueryResponse(data) {
    if (!isRAGQueryResult(data)) {
        throw new ValidationError('Invalid RAGQueryResult response from API');
    }
    return data;
}
//# sourceMappingURL=types.js.map