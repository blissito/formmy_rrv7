/**
 * Type Definitions and Runtime Validators for Formmy Parser SDK
 */

import { ValidationError } from './errors';

// ============ ENUMS ============

export type ParsingMode = 'DEFAULT' | 'COST_EFFECTIVE' | 'AGENTIC' | 'AGENTIC_PLUS';
export type JobStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
export type QueryMode = 'fast' | 'accurate';

// ============ INTERFACES ============

export interface ParserConfig {
  apiKey: string;
  baseUrl?: string;
  debug?: boolean;
  timeout?: number; // Request timeout in ms (default: 30000)
  retries?: number; // Number of retries (default: 3)
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
  pollInterval?: number; // ms between checks (default: 2000)
  timeout?: number; // total timeout in ms (default: 300000 = 5 min)
  onProgress?: (job: ParsingJob) => void; // callback with current status
}

export interface RAGQueryOptions {
  mode?: QueryMode; // default: 'accurate'
  contextId?: string; // For specific document testing
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
  answer?: string; // Only in mode="accurate"
  results?: RAGSource[];
  sources?: RAGSource[];
  creditsUsed: number;
  processingTime: number;
}

// ============ TYPE GUARDS ============

export function isParsingMode(value: any): value is ParsingMode {
  return (
    typeof value === 'string' &&
    ['DEFAULT', 'COST_EFFECTIVE', 'AGENTIC', 'AGENTIC_PLUS'].includes(value)
  );
}

export function isJobStatus(value: any): value is JobStatus {
  return (
    typeof value === 'string' &&
    ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'].includes(value)
  );
}

export function isQueryMode(value: any): value is QueryMode {
  return typeof value === 'string' && ['fast', 'accurate'].includes(value);
}

export function isParsingJob(value: any): value is ParsingJob {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof value.id === 'string' &&
    isJobStatus(value.status) &&
    typeof value.fileName === 'string' &&
    isParsingMode(value.mode) &&
    typeof value.creditsUsed === 'number' &&
    typeof value.createdAt === 'string'
  );
}

export function isRAGQueryResult(value: any): value is RAGQueryResult {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof value.query === 'string' &&
    typeof value.creditsUsed === 'number' &&
    typeof value.processingTime === 'number'
  );
}

// ============ VALIDATORS ============

export function validateApiKey(apiKey: string): void {
  if (!apiKey || typeof apiKey !== 'string') {
    throw new ValidationError('API key is required');
  }

  if (!apiKey.startsWith('sk_live_') && !apiKey.startsWith('sk_test_')) {
    throw new ValidationError(
      'Invalid API key format. Must start with sk_live_ or sk_test_'
    );
  }
}

export function validateParsingMode(mode: any): asserts mode is ParsingMode {
  if (!isParsingMode(mode)) {
    throw new ValidationError(
      `Invalid parsing mode: ${mode}. Must be one of: DEFAULT, COST_EFFECTIVE, AGENTIC, AGENTIC_PLUS`
    );
  }
}

export function validateQueryMode(mode: any): asserts mode is QueryMode {
  if (!isQueryMode(mode)) {
    throw new ValidationError(
      `Invalid query mode: ${mode}. Must be one of: fast, accurate`
    );
  }
}

export function validateJobId(jobId: any): asserts jobId is string {
  if (!jobId || typeof jobId !== 'string') {
    throw new ValidationError('Job ID is required and must be a string');
  }
}

export function validateChatbotId(chatbotId: any): asserts chatbotId is string {
  if (!chatbotId || typeof chatbotId !== 'string') {
    throw new ValidationError('Chatbot ID is required and must be a string');
  }
}

export function validateQuery(query: any): asserts query is string {
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
export function validateParsingJobResponse(data: any): ParsingJob {
  if (!isParsingJob(data)) {
    throw new ValidationError('Invalid ParsingJob response from API');
  }
  return data;
}

/**
 * Validate and parse API response as RAGQueryResult
 */
export function validateRAGQueryResponse(data: any): RAGQueryResult {
  if (!isRAGQueryResult(data)) {
    throw new ValidationError('Invalid RAGQueryResult response from API');
  }
  return data;
}
