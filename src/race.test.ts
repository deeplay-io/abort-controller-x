import defer from 'defer-promise';
import expect from 'expect';
import {AbortError} from './AbortError';
import {race} from './race';
import {spyOn} from './testUtils/spy';
import {nextTick} from './utils/nextTick';

it('external abort', async () => {
  const abortController = new AbortController();
  const signal = abortController.signal;
  const addEventListenerSpy = spyOn(signal, 'addEventListener');
  const removeEventListenerSpy = spyOn(signal, 'removeEventListener');

  const deferred1 = defer<string>();
  const deferred2 = defer<number>();

  let result: PromiseSettledResult<string | number> | undefined;
  let innerSignal: AbortSignal;

  race(signal, signal => {
    innerSignal = signal;
    return [deferred1.promise, deferred2.promise];
  }).then(
    value => {
      result = {status: 'fulfilled', value};
    },
    reason => {
      result = {status: 'rejected', reason};
    },
  );

  abortController.abort();

  expect(innerSignal!.aborted).toBe(true);

  await nextTick();

  expect(result).toBeUndefined();

  deferred1.reject(new AbortError());
  await nextTick();

  expect(result).toBeUndefined();

  deferred2.reject(new AbortError());
  await nextTick();

  expect(result).toMatchObject({
    status: 'rejected',
    reason: {name: 'AbortError'},
  });

  expect(addEventListenerSpy.callCount).toBe(1);
  expect(removeEventListenerSpy.callCount).toBe(1);
});

it('fulfill', async () => {
  const abortController = new AbortController();
  const signal = abortController.signal;
  const addEventListenerSpy = spyOn(signal, 'addEventListener');
  const removeEventListenerSpy = spyOn(signal, 'removeEventListener');

  const deferred1 = defer<string>();
  const deferred2 = defer<number>();

  let result: PromiseSettledResult<string | number> | undefined;
  let innerSignal: AbortSignal;

  race(signal, signal => {
    innerSignal = signal;
    return [deferred1.promise, deferred2.promise];
  }).then(
    value => {
      result = {status: 'fulfilled', value};
    },
    reason => {
      result = {status: 'rejected', reason};
    },
  );

  await nextTick();

  expect(result).toBeUndefined();
  expect(innerSignal!.aborted).toBe(false);

  deferred1.resolve('test');
  await nextTick();

  expect(result).toBeUndefined();
  expect(innerSignal!.aborted).toBe(true);

  deferred2.reject(new AbortError());
  await nextTick();

  expect(result).toMatchObject({
    status: 'fulfilled',
    value: 'test',
  });

  expect(addEventListenerSpy.callCount).toBe(1);
  expect(removeEventListenerSpy.callCount).toBe(1);
});

it('reject', async () => {
  const abortController = new AbortController();
  const signal = abortController.signal;
  const addEventListenerSpy = spyOn(signal, 'addEventListener');
  const removeEventListenerSpy = spyOn(signal, 'removeEventListener');

  const deferred1 = defer<string>();
  const deferred2 = defer<number>();

  let result: PromiseSettledResult<string | number> | undefined;
  let innerSignal: AbortSignal;

  race(signal, signal => {
    innerSignal = signal;
    return [deferred1.promise, deferred2.promise];
  }).then(
    value => {
      result = {status: 'fulfilled', value};
    },
    reason => {
      result = {status: 'rejected', reason};
    },
  );

  await nextTick();

  expect(result).toBeUndefined();
  expect(innerSignal!.aborted).toBe(false);

  deferred1.reject('test');
  await nextTick();

  expect(result).toBeUndefined();
  expect(innerSignal!.aborted).toBe(true);

  deferred2.reject(new AbortError());
  await nextTick();

  expect(result).toMatchObject({
    status: 'rejected',
    reason: 'test',
  });

  expect(addEventListenerSpy.callCount).toBe(1);
  expect(removeEventListenerSpy.callCount).toBe(1);
});

it('reject during cleanup', async () => {
  const abortController = new AbortController();
  const signal = abortController.signal;
  const addEventListenerSpy = spyOn(signal, 'addEventListener');
  const removeEventListenerSpy = spyOn(signal, 'removeEventListener');

  const deferred1 = defer<string>();
  const deferred2 = defer<number>();

  let result: PromiseSettledResult<string | number> | undefined;
  let innerSignal: AbortSignal;

  race(signal, signal => {
    innerSignal = signal;
    return [deferred1.promise, deferred2.promise];
  }).then(
    value => {
      result = {status: 'fulfilled', value};
    },
    reason => {
      result = {status: 'rejected', reason};
    },
  );

  abortController.abort();

  expect(innerSignal!.aborted).toBe(true);

  await nextTick();

  expect(result).toBeUndefined();

  deferred1.reject(new AbortError());
  await nextTick();

  expect(result).toBeUndefined();

  deferred2.reject(new Error('test'));
  await nextTick();

  expect(result).toMatchObject({
    status: 'rejected',
    reason: {message: 'test'},
  });

  expect(addEventListenerSpy.callCount).toBe(1);
  expect(removeEventListenerSpy.callCount).toBe(1);
});
