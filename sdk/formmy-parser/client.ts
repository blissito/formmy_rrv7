/**
 * Formmy Parser SDK Client
 * Production-ready TypeScript client with retry logic, error handling, and dual environment support
 */

import {
  type ParserConfig,
  type ParsingJob,
  type ParsingMode,
  type RAGQueryOptions,
  type RAGQueryResult,
  type WaitForOptions,
  validateApiKey,
  validateParsingMode,
  validateQueryMode,
  validateJobId,
  validateChatbotId,
  validateQuery,
  validateParsingJobResponse,
  validateRAGQueryResponse,
} from './types';

import {
  handleErrorResponse,
  NetworkError,
  TimeoutError,
  ParsingFailedError,
} from './errors';

// ============ HELPERS ============

/**
 * Check if running in Node.js environment
 */
const isNode =
  typeof process !== 'undefined' &&
  process.versions != null &&
  process.versions.node != null;

/**
 * Sleep utility for retry logic
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Exponential backoff calculator
 */
function getBackoffDelay(attempt: number, baseDelay: number = 1000): number {
  return Math.min(baseDelay * Math.pow(2, attempt), 10000);
}

/**
 * Retry wrapper with exponential backoff
 */
async function withRetry<T>(
  fn: () => Promise<T>,
  options: {
    retries: number;
    onRetry?: (attempt: number, error: Error) => void;
    shouldRetry?: (error: any) => boolean;
  }
): Promise<T> {
  const { retries, onRetry, shouldRetry } = options;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      const isLastAttempt = attempt === retries;
      const canRetry = shouldRetry ? shouldRetry(error) : true;

      if (isLastAttempt || !canRetry) {
        throw error;
      }

      const delay = getBackoffDelay(attempt);
      if (onRetry) {
        onRetry(attempt + 1, error);
      }

      await sleep(delay);
    }
  }

  throw new Error('Retry logic failed unexpectedly');
}

/**
 * Create FormData compatible with both Node and Browser
 */
async function createFormData(
  file: string | Buffer | Blob,
  mode: ParsingMode
): Promise<FormData> {
  const formData = new FormData();

  if (isNode && typeof file === 'string') {
    // Node.js: Import fs dynamically
    const fs = await import('fs');
    const path = await import('path');

    const filePath = path.resolve(file);
    const fileBuffer = fs.readFileSync(filePath);
    const fileName = path.basename(filePath);
    const blob = new Blob([fileBuffer]);

    formData.append('file', blob, fileName);
  } else if (file instanceof Buffer) {
    // Node.js: Buffer
    const blob = new Blob([file]);
    formData.append('file', blob, 'document.pdf');
  } else if (file instanceof Blob) {
    // Browser: Blob or File
    formData.append('file', file);
  } else {
    throw new Error('Invalid file type. Expected string path, Buffer, or Blob');
  }

  formData.append('mode', mode);
  return formData;
}

// ============ CLIENT ============

export class FormmyParser {
  private apiKey: string;
  private baseUrl: string;
  private debug: boolean;
  private timeout: number;
  private retries: number;

  constructor(config: ParserConfig | string) {
    if (typeof config === 'string') {
      this.apiKey = config;
      this.baseUrl = 'https://formmy-v2.fly.dev';
      this.debug = false;
      this.timeout = 30000;
      this.retries = 3;
    } else {
      this.apiKey = config.apiKey;
      this.baseUrl = config.baseUrl || 'https://formmy-v2.fly.dev';
      this.debug = config.debug || false;
      this.timeout = config.timeout || 30000;
      this.retries = config.retries || 3;
    }

    validateApiKey(this.apiKey);
  }

  /**
   * Internal fetch wrapper with timeout and error handling
   */
  private async fetch(
    url: string,
    options: RequestInit = {}
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      if (this.debug) {
        console.log(`[FormmyParser] ${options.method || 'GET'} ${url}`);
      }

      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return response;
    } catch (error: any) {
      clearTimeout(timeoutId);

      if (error.name === 'AbortError') {
        throw new NetworkError(new Error(`Request timeout after ${this.timeout}ms`));
      }

      throw new NetworkError(error);
    }
  }

  /**
   * Handle API response and parse JSON with error handling
   */
  private async handleResponse<T>(
    response: Response,
    validator?: (data: any) => T
  ): Promise<T> {
    const responseText = await response.text();

    if (this.debug) {
      console.log(`[FormmyParser] Response ${response.status}: ${responseText.substring(0, 200)}`);
    }

    if (!response.ok) {
      let responseBody: any = responseText;
      try {
        responseBody = JSON.parse(responseText);
      } catch {
        // Keep as text
      }
      handleErrorResponse(response.status, responseBody, responseText);
    }

    const data = JSON.parse(responseText);
    return validator ? validator(data) : data;
  }

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
  async parse(
    file: string | Buffer | Blob,
    mode: ParsingMode = 'AGENTIC'
  ): Promise<ParsingJob> {
    validateParsingMode(mode);

    const formData = await createFormData(file, mode);

    return withRetry(
      async () => {
        const response = await this.fetch(
          `${this.baseUrl}/api/parser/v1?intent=upload`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${this.apiKey}`,
            },
            body: formData,
          }
        );

        return this.handleResponse(response, validateParsingJobResponse);
      },
      {
        retries: this.retries,
        onRetry: (attempt, error) => {
          if (this.debug) {
            console.log(`[FormmyParser] Retry ${attempt}/${this.retries}: ${error.message}`);
          }
        },
        shouldRetry: (error) => {
          // Retry on network errors and 5xx, but not on 4xx (client errors)
          if (error instanceof NetworkError) return true;
          if (error.statusCode && error.statusCode >= 500) return true;
          return false;
        },
      }
    );
  }

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
  async getStatus(jobId: string): Promise<ParsingJob> {
    validateJobId(jobId);

    return withRetry(
      async () => {
        const response = await this.fetch(
          `${this.baseUrl}/api/parser/v1?intent=status&jobId=${encodeURIComponent(jobId)}`,
          {
            headers: {
              Authorization: `Bearer ${this.apiKey}`,
            },
          }
        );

        return this.handleResponse(response, validateParsingJobResponse);
      },
      {
        retries: this.retries,
        onRetry: (attempt, error) => {
          if (this.debug) {
            console.log(`[FormmyParser] Retry ${attempt}/${this.retries}: ${error.message}`);
          }
        },
        shouldRetry: (error) => {
          if (error instanceof NetworkError) return true;
          if (error.statusCode && error.statusCode >= 500) return true;
          return false;
        },
      }
    );
  }

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
  async waitFor(jobId: string, options: WaitForOptions = {}): Promise<ParsingJob> {
    validateJobId(jobId);

    const pollInterval = options.pollInterval || 2000;
    const timeout = options.timeout || 300000;
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      const job = await this.getStatus(jobId);

      // Progress callback
      if (options.onProgress) {
        options.onProgress(job);
      }

      // Completed successfully
      if (job.status === 'COMPLETED') {
        return job;
      }

      // Failed
      if (job.status === 'FAILED') {
        throw new ParsingFailedError(jobId, job.error);
      }

      // Continue waiting
      await sleep(pollInterval);
    }

    throw new TimeoutError(jobId, timeout);
  }

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
  async query(
    query: string,
    chatbotId: string,
    options: RAGQueryOptions = {}
  ): Promise<RAGQueryResult> {
    validateQuery(query);
    validateChatbotId(chatbotId);

    const { mode = 'accurate', contextId } = options;
    validateQueryMode(mode);

    return withRetry(
      async () => {
        const response = await this.fetch(`${this.baseUrl}/api/rag/v1?intent=query`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query,
            chatbotId,
            contextId,
            mode,
          }),
        });

        return this.handleResponse(response, validateRAGQueryResponse);
      },
      {
        retries: this.retries,
        onRetry: (attempt, error) => {
          if (this.debug) {
            console.log(`[FormmyParser] Retry ${attempt}/${this.retries}: ${error.message}`);
          }
        },
        shouldRetry: (error) => {
          if (error instanceof NetworkError) return true;
          if (error.statusCode && error.statusCode >= 500) return true;
          return false;
        },
      }
    );
  }
}
