/**
 * Formmy Parser SDK
 * Official TypeScript/JavaScript SDK for Formmy Parser & RAG API
 *
 * @packageDocumentation
 */
export { FormmyParser } from './client';
export type { ParserConfig, ParsingJob, ParsingMode, JobStatus, QueryMode, WaitForOptions, RAGQueryOptions, RAGQueryResult, RAGSource, } from './types';
export { FormmyParserError, AuthenticationError, InsufficientCreditsError, RateLimitError, ValidationError, JobNotFoundError, ParsingFailedError, TimeoutError, NetworkError, } from './errors';
import { FormmyParser } from './client';
export default FormmyParser;
//# sourceMappingURL=index.d.ts.map