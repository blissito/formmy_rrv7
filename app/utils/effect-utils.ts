import { Effect } from "effect";

/**
 * Helper function to create a JSON Response with proper headers
 */
export function json<T = any>(
  status: number,
  data: T,
  init?: ResponseInit
): Response {
  return new Response(JSON.stringify(data), {
    ...init,
    status,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  });
}

/**
 * Helper function to create an error effect with proper typing
 */
export function failWithError(
  message: string,
  status: number = 500,
  details?: unknown
) {
  return Effect.fail({
    _tag: 'ApiError',
    message,
    status,
    details,
  } as const);
}

/**
 * Type for API errors
 */
export interface ApiError {
  readonly _tag: 'ApiError';
  readonly message: string;
  readonly status: number;
  readonly details?: unknown;
}

/**
 * Type guard for ApiError
 */
export function isApiError(error: unknown): error is ApiError {
  return (
    typeof error === 'object' &&
    error !== null &&
    '_tag' in error &&
    (error as any)._tag === 'ApiError'
  );
}
