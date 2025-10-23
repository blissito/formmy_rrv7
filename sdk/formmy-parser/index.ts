/**
 * Formmy SDK
 * RAG as a Service - Official TypeScript/JavaScript SDK
 *
 * Upload documents → Query knowledge → Get AI answers
 * We handle: parsing, chunking, embeddings, vector storage, semantic search
 *
 * @packageDocumentation
 */

// Main client
export { Formmy, FormmyParser } from './client.js';

// Types
export type {
  ParserConfig,
  ParsingJob,
  ParsingMode,
  JobStatus,
  QueryMode,
  WaitForOptions,
  RAGQueryOptions,
  RAGQueryResult,
  RAGSource,
} from './types.js';

// Errors
export {
  FormmyParserError,
  AuthenticationError,
  InsufficientCreditsError,
  RateLimitError,
  ValidationError,
  JobNotFoundError,
  ParsingFailedError,
  TimeoutError,
  NetworkError,
} from './errors.js';

// Re-export as default for CommonJS compatibility
import { FormmyParser } from './client.js';
export default FormmyParser;
