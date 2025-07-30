import { Effect, Schedule, Duration, Match } from "effect";
import { WhatsAppConfig } from "./config.js";
import { ApiError, WhatsAppError } from "./types.js";

// ============================================================================
// Retry Configuration Types
// ============================================================================

export interface RetryConfig {
  readonly maxRetries: number;
  readonly baseDelayMs: number;
  readonly maxDelayMs: number;
  readonly backoffMultiplier: number;
  readonly jitterEnabled: boolean;
}

// ============================================================================
// Default Retry Configuration
// ============================================================================

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 30000,
  backoffMultiplier: 2,
  jitterEnabled: true,
};

// ============================================================================
// Error Classification for Retry Logic
// ============================================================================

/**
 * Determines if an error should trigger a retry attempt
 * Client errors (4xx) should not be retried
 * Server errors (5xx) and network errors should be retried
 */
export const shouldRetryError = (error: unknown): boolean =>
  Match.value(error).pipe(
    Match.when(Match.instanceOf(ApiError), (apiError) => {
      // Always retry rate limiting errors (429)
      if (apiError.status === 429) {
        return true;
      }
      // Don't retry other client errors (4xx)
      if (apiError.status >= 400 && apiError.status < 500) {
        return false;
      }
      // Retry server errors (5xx)
      if (apiError.status >= 500) {
        return true;
      }
      // Retry other API errors (network issues, etc.)
      return true;
    }),
    Match.when(Match.instanceOf(WhatsAppError), (whatsappError) => {
      // Retry network-related errors
      return (
        whatsappError.code === "NETWORK_ERROR" ||
        whatsappError.code === "TIMEOUT_ERROR" ||
        whatsappError.code === "CONNECTION_ERROR"
      );
    }),
    // Don't retry other types of errors by default
    Match.orElse(() => false)
  );

// ============================================================================
// Retry Schedule Creation
// ============================================================================

/**
 * Creates an exponential backoff retry schedule with jitter
 * Distinguishes between client (4xx) and server (5xx) errors
 */
export const createRetrySchedule = (config: RetryConfig) => {
  const baseSchedule = Schedule.exponential(
    Duration.millis(config.baseDelayMs),
    config.backoffMultiplier
  ).pipe(
    // Cap the maximum delay
    Schedule.either(Schedule.spaced(Duration.millis(config.maxDelayMs))),
    // Limit the number of retries
    Schedule.intersect(Schedule.recurs(config.maxRetries))
  );

  // Add jitter if enabled
  const scheduleWithJitter = config.jitterEnabled
    ? baseSchedule.pipe(Schedule.jittered)
    : baseSchedule;

  // Only retry if the error should be retried
  return scheduleWithJitter.pipe(Schedule.whileInput(shouldRetryError));
};

/**
 * Creates a retry schedule from WhatsApp configuration
 */
export const createRetryScheduleFromConfig = (config: WhatsAppConfig) =>
  createRetrySchedule({
    maxRetries: config.maxRetries,
    baseDelayMs: config.retryDelayMs,
    maxDelayMs: Math.max(config.retryDelayMs * 10, 30000), // Cap at 30 seconds or 10x base delay
    backoffMultiplier: 2,
    jitterEnabled: true,
  });

// ============================================================================
// Retry Wrapper Functions
// ============================================================================

/**
 * Wraps an Effect with retry logic using the provided schedule
 */
export const withRetry = <A, E>(
  effect: Effect.Effect<A, E>,
  schedule: Schedule.Schedule<unknown, E>
) =>
  effect.pipe(
    Effect.retry(schedule),
    Effect.tapError((error) =>
      Effect.logWarning("Operation failed after all retry attempts", {
        error: String(error),
        timestamp: new Date().toISOString(),
      })
    )
  );

/**
 * Wraps an Effect with retry logic using WhatsApp configuration
 */
export const withWhatsAppRetry = <A, E>(
  effect: Effect.Effect<A, E>,
  config: WhatsAppConfig
) => {
  const retrySchedule = createRetryScheduleFromConfig(config);
  return withRetry(effect, retrySchedule);
};

/**
 * Wraps an Effect with retry logic and detailed logging
 */
export const withRetryAndLogging = <A, E>(
  effect: Effect.Effect<A, E>,
  schedule: Schedule.Schedule<unknown, E>,
  operationName: string
) =>
  effect.pipe(
    Effect.retry(
      schedule.pipe(
        Schedule.tapInput((error) =>
          Effect.logWarning(`Retrying ${operationName} due to error`, {
            error: String(error),
            operationName,
            timestamp: new Date().toISOString(),
          })
        )
      )
    ),
    Effect.tapError((error) =>
      Effect.logError(`${operationName} failed after all retry attempts`, {
        error: String(error),
        operationName,
        timestamp: new Date().toISOString(),
      })
    ),
    Effect.tap(() =>
      Effect.logInfo(`${operationName} completed successfully`, {
        operationName,
        timestamp: new Date().toISOString(),
      })
    )
  );

// ============================================================================
// Specialized Retry Functions for WhatsApp Operations
// ============================================================================

/**
 * Retry wrapper specifically for message sending operations
 */
export const withMessageSendRetry = <A>(
  effect: Effect.Effect<A, ApiError>,
  config: WhatsAppConfig
) =>
  withRetryAndLogging(
    effect,
    createRetryScheduleFromConfig(config),
    "Message Send"
  );

/**
 * Retry wrapper specifically for media upload operations
 */
export const withMediaUploadRetry = <A>(
  effect: Effect.Effect<A, ApiError>,
  config: WhatsAppConfig
) =>
  withRetryAndLogging(
    effect,
    createRetryScheduleFromConfig(config),
    "Media Upload"
  );

/**
 * Retry wrapper specifically for media download operations
 */
export const withMediaDownloadRetry = <A>(
  effect: Effect.Effect<A, ApiError>,
  config: WhatsAppConfig
) =>
  withRetryAndLogging(
    effect,
    createRetryScheduleFromConfig(config),
    "Media Download"
  );

/**
 * Retry wrapper specifically for webhook processing operations
 */
export const withWebhookProcessingRetry = <A>(
  effect: Effect.Effect<A, WhatsAppError>,
  config: WhatsAppConfig
) =>
  withRetryAndLogging(
    effect,
    createRetryScheduleFromConfig(config),
    "Webhook Processing"
  );

// ============================================================================
// Rate Limiting Aware Retry Schedule
// ============================================================================

/**
 * Creates a retry schedule that handles WhatsApp API rate limiting
 * WhatsApp API has rate limits that may require longer delays
 */
export const createRateLimitAwareRetrySchedule = (config: RetryConfig) => {
  const baseSchedule = createRetrySchedule(config);

  return baseSchedule.pipe(
    Schedule.whileInput((error: unknown) => {
      // Check if this is a rate limit error
      if (error instanceof ApiError && error.status === 429) {
        // For rate limit errors, we want to retry with longer delays
        return true;
      }
      return shouldRetryError(error);
    }),
    Schedule.modifyDelay((_, delay) =>
      // For rate limit scenarios, use longer delays
      Duration.max(delay, Duration.seconds(5))
    )
  );
};

/**
 * Retry wrapper that handles rate limiting specifically
 */
export const withRateLimitRetry = <A>(
  effect: Effect.Effect<A, ApiError>,
  config: WhatsAppConfig
) => {
  const rateLimitSchedule = createRateLimitAwareRetrySchedule({
    maxRetries: config.maxRetries,
    baseDelayMs: config.retryDelayMs,
    maxDelayMs: 60000, // 1 minute max for rate limit scenarios
    backoffMultiplier: 2,
    jitterEnabled: true,
  });

  return withRetryAndLogging(
    effect,
    rateLimitSchedule,
    "Rate Limited Operation"
  );
};

// ============================================================================
// Retry Statistics and Monitoring
// ============================================================================

export interface RetryStats {
  readonly totalAttempts: number;
  readonly successfulAttempts: number;
  readonly failedAttempts: number;
  readonly averageRetryCount: number;
  readonly lastRetryTimestamp: string;
}

/**
 * Creates a retry schedule that collects statistics
 */
export const createRetryScheduleWithStats = (
  config: RetryConfig,
  statsRef: { current: RetryStats }
) => {
  return createRetrySchedule(config).pipe(
    Schedule.tapInput(() =>
      Effect.sync(() => {
        statsRef.current = {
          ...statsRef.current,
          totalAttempts: statsRef.current.totalAttempts + 1,
          lastRetryTimestamp: new Date().toISOString(),
        };
      })
    )
  );
};

// ============================================================================
// Circuit Breaker Integration
// ============================================================================

/**
 * Creates a retry schedule with circuit breaker pattern
 * After too many consecutive failures, stops retrying for a period
 */
export const createCircuitBreakerRetrySchedule = (
  config: RetryConfig,
  failureThreshold: number = 10,
  recoveryTimeMs: number = 60000
) => {
  let consecutiveFailures = 0;
  let lastFailureTime = 0;

  return createRetrySchedule(config).pipe(
    Schedule.whileInput((error: unknown) => {
      const now = Date.now();

      // Check if we're in recovery period
      if (consecutiveFailures >= failureThreshold) {
        if (now - lastFailureTime < recoveryTimeMs) {
          return false; // Circuit is open, don't retry
        } else {
          // Reset circuit breaker
          consecutiveFailures = 0;
        }
      }

      if (shouldRetryError(error)) {
        consecutiveFailures++;
        lastFailureTime = now;
        return true;
      }

      return false;
    })
  );
};

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Calculates the next retry delay with exponential backoff
 */
export const calculateRetryDelay = (
  attempt: number,
  baseDelayMs: number,
  backoffMultiplier: number,
  maxDelayMs: number,
  jitter: boolean = true
): number => {
  const exponentialDelay = baseDelayMs * Math.pow(backoffMultiplier, attempt);
  const cappedDelay = Math.min(exponentialDelay, maxDelayMs);

  if (jitter) {
    // Add ±25% jitter
    const jitterAmount = cappedDelay * 0.25;
    return cappedDelay + (Math.random() - 0.5) * 2 * jitterAmount;
  }

  return cappedDelay;
};

/**
 * Formats retry delay for logging
 */
export const formatRetryDelay = (delayMs: number): string => {
  if (delayMs < 1000) {
    return `${delayMs}ms`;
  } else if (delayMs < 60000) {
    return `${(delayMs / 1000).toFixed(1)}s`;
  } else {
    return `${(delayMs / 60000).toFixed(1)}m`;
  }
};

/**
 * Creates a human-readable description of retry configuration
 */
export const describeRetryConfig = (config: RetryConfig): string => {
  return `Max retries: ${config.maxRetries}, Base delay: ${formatRetryDelay(
    config.baseDelayMs
  )}, Max delay: ${formatRetryDelay(config.maxDelayMs)}, Backoff: ${
    config.backoffMultiplier
  }x, Jitter: ${config.jitterEnabled ? "enabled" : "disabled"}`;
};
