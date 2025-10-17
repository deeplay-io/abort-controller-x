import expect from 'expect';
import {
  AbortError,
  catchAbortError,
  isAbortError,
  rethrowAbortError,
  throwIfAborted,
} from './AbortError';

it('isAbortError', () => {
  expect(isAbortError({})).toBe(false);
  expect(isAbortError(undefined)).toBe(false);
  expect(isAbortError(null)).toBe(false);

  expect(isAbortError(new AbortError())).toBe(true);
});

it('throwIfAborted', () => {
  const abortController = new AbortController();

  expect(() => throwIfAborted(abortController.signal)).not.toThrow();

  abortController.abort();

  expect(() => throwIfAborted(abortController.signal)).toThrow(AbortError);
});

it('rethrowAbortError', () => {
  expect(() => rethrowAbortError(new AbortError())).toThrow(AbortError);
  expect(() => rethrowAbortError(new Error())).not.toThrow();
});

it('catchAbortError', () => {
  expect(() => catchAbortError(new AbortError())).not.toThrow();
  expect(() => catchAbortError(new Error())).toThrow();
});
