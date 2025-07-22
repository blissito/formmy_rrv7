/**
 * A utility function to handle async operations with error handling
 * This replaces try/catch blocks with a more functional approach
 *
 * @param fn The async function to execute
 * @param errorHandler The function to handle errors
 * @returns The result of the async function or the error handler
 */
export async function effect<T>(
  fn: () => Promise<T>,
  errorHandler: (error: Error) => T
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    return errorHandler(
      error instanceof Error ? error : new Error(String(error))
    );
  }
}
