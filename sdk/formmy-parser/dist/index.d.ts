/**
 * Formmy SDK
 * RAG as a Service - Official TypeScript/JavaScript SDK
 *
 * Upload documents → Query knowledge → Get AI answers
 * We handle: parsing, chunking, embeddings, vector storage, semantic search
 *
 * @packageDocumentation
 */
export { Formmy, FormmyParser } from './client.js';
export type { ParserConfig, ParsingJob, ParsingMode, JobStatus, QueryMode, WaitForOptions, RAGQueryOptions, RAGQueryResult, RAGSource, } from './types.js';
export { FormmyParserError, AuthenticationError, InsufficientCreditsError, RateLimitError, ValidationError, JobNotFoundError, ParsingFailedError, TimeoutError, NetworkError, } from './errors.js';
import { FormmyParser } from './client.js';
export default FormmyParser;
//# sourceMappingURL=index.d.ts.map