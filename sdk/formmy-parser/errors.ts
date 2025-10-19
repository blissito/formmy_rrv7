/**
 * Custom Error Classes for Formmy Parser SDK
 * Provides specific error types for better error handling
 */

export class FormmyParserError extends Error {
  public readonly statusCode?: number;
  public readonly response?: any;

  constructor(message: string, statusCode?: number, response?: any) {
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
  constructor(message: string = 'Invalid API key') {
    super(message, 401);
    this.name = 'AuthenticationError';
  }
}

export class InsufficientCreditsError extends FormmyParserError {
  public readonly creditsRequired: number;
  public readonly creditsAvailable: number;

  constructor(required: number, available: number) {
    super(
      `Insufficient credits: ${available} available, ${required} required`,
      402
    );
    this.name = 'InsufficientCreditsError';
    this.creditsRequired = required;
    this.creditsAvailable = available;
  }
}

export class RateLimitError extends FormmyParserError {
  public readonly retryAfter?: number; // seconds

  constructor(message: string = 'Rate limit exceeded', retryAfter?: number) {
    super(message, 429);
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
  }
}

export class ValidationError extends FormmyParserError {
  constructor(message: string) {
    super(message, 400);
    this.name = 'ValidationError';
  }
}

export class JobNotFoundError extends FormmyParserError {
  constructor(jobId: string) {
    super(`Job not found: ${jobId}`, 404);
    this.name = 'JobNotFoundError';
  }
}

export class ParsingFailedError extends FormmyParserError {
  public readonly jobId: string;

  constructor(jobId: string, reason?: string) {
    super(`Parsing failed for job ${jobId}${reason ? `: ${reason}` : ''}`, 500);
    this.name = 'ParsingFailedError';
    this.jobId = jobId;
  }
}

export class TimeoutError extends FormmyParserError {
  public readonly jobId: string;
  public readonly timeoutMs: number;

  constructor(jobId: string, timeoutMs: number) {
    super(`Timeout waiting for job ${jobId} after ${timeoutMs}ms`, 408);
    this.name = 'TimeoutError';
    this.jobId = jobId;
    this.timeoutMs = timeoutMs;
  }
}

export class NetworkError extends FormmyParserError {
  public readonly originalError: Error;

  constructor(originalError: Error) {
    super(`Network error: ${originalError.message}`, 0);
    this.name = 'NetworkError';
    this.originalError = originalError;
  }
}

/**
 * Parse error response and throw appropriate custom error
 */
export function handleErrorResponse(
  status: number,
  responseBody: any,
  responseText: string
): never {
  // Try to extract error message
  let errorMessage: string;
  try {
    const parsed = typeof responseBody === 'string' ? JSON.parse(responseBody) : responseBody;
    errorMessage = parsed.error || parsed.message || responseText.substring(0, 300);
  } catch {
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
        throw new InsufficientCreditsError(
          parseInt(match[2], 10),
          parseInt(match[1], 10)
        );
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
