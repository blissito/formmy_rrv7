/**
 * Formmy Parser SDK
 * Official TypeScript/JavaScript SDK for Formmy Parser & RAG API
 *
 * @packageDocumentation
 */
// Main client
export { FormmyParser } from './client';
// Errors
export { FormmyParserError, AuthenticationError, InsufficientCreditsError, RateLimitError, ValidationError, JobNotFoundError, ParsingFailedError, TimeoutError, NetworkError, } from './errors';
// Re-export as default for CommonJS compatibility
import { FormmyParser } from './client';
export default FormmyParser;
//# sourceMappingURL=index.js.map