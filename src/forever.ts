import {execute} from './execute.js';

/**
 * Return a promise that never fulfills and only rejects with `AbortError` once
 * `signal` is aborted.
 */
export function forever(signal: AbortSignal): Promise<never> {
  return execute(signal, () => () => {});
}
