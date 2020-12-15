import {execute} from './execute';

/**
 * Returns a promise that fulfills after delay and rejects with
 * `AbortError` once `signal` is aborted.
 *
 * The delay time is specified as a `Date` object or as an integer denoting
 * milliseconds to wait.
 */
export function delay(
  signal: AbortSignal,
  dueTime: number | Date,
): Promise<void> {
  return execute<void>(signal, resolve => {
    const ms =
      typeof dueTime === 'number' ? dueTime : dueTime.getTime() - Date.now();

    const timer = setTimeout(resolve, ms);

    return () => {
      clearTimeout(timer);
    };
  });
}
