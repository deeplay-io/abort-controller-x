import {AbortSignal} from 'abort-controller';
import {delay} from './delay';
import {rethrowAbortError} from './AbortError';

export type RetryOptions = {
  /**
   * Starting delay before first retry attempt in milliseconds.
   *
   * Defaults to 1000.
   *
   * Example: if `baseMs` is 100, then retries will be attempted in 100ms,
   * 200ms, 400ms etc (not counting jitter).
   */
  baseMs?: number;
  /**
   * Maximum delay between attempts in milliseconds.
   *
   * Defaults to 15 seconds.
   *
   * Example: if `baseMs` is 1000 and `maxDelayMs` is 3000, then retries will be
   * attempted in 1000ms, 2000ms, 3000ms, 3000ms etc (not counting jitter).
   */
  maxDelayMs?: number;
  /**
   * Maximum for the total number of attempts.
   *
   * Defaults to `Infinity`.
   */
  maxAttempts?: number;
  /**
   * Called after each failed attempt before setting delay timer.
   *
   * Rethrow error from this callback to prevent further retries.
   */
  onError?: (error: unknown, attempt: number, delayMs: number) => void;
};

/**
 * Retry function with exponential backoff.
 */
export async function retry<T>(
  signal: AbortSignal,
  fn: (signal: AbortSignal, attempt: number) => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const {
    baseMs = 1000,
    maxDelayMs = 15000,
    onError,
    maxAttempts = Infinity,
  } = options;

  for (let attempt = 0; ; attempt++) {
    try {
      return await fn(signal, attempt);
    } catch (error) {
      rethrowAbortError(error);

      if (attempt >= maxAttempts) {
        throw error;
      }

      // https://aws.amazon.com/ru/blogs/architecture/exponential-backoff-and-jitter/
      const backoff = Math.min(maxDelayMs, Math.pow(2, attempt) * baseMs);
      const delayMs = Math.round((backoff * (1 + Math.random())) / 2);

      if (onError) {
        onError(error, attempt, delayMs);
      }

      await delay(signal, delayMs);
    }
  }
}
