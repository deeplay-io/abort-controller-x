import expect from 'expect';
import {spawn} from './spawn';
import {createSpy, spyOn} from './testUtils/spy';
import {forever} from './forever';
import {delay} from './delay';

it('fork manual abort', async () => {
  const abortController = new AbortController();
  const signal = abortController.signal;
  const addEventListenerSpy = spyOn(signal, 'addEventListener');
  const removeEventListenerSpy = spyOn(signal, 'removeEventListener');

  const actions: string[] = [];

  await spawn(signal, async (signal, {fork}) => {
    const task = fork(async signal => {
      actions.push('fork start');
      try {
        await forever(signal);
      } catch (err: any) {
        actions.push(`fork abort: ${err.message}`);
      }
    });

    actions.push('post fork');
    await delay(signal, 0);
    actions.push('pre task abort');
    task.abort();
    await delay(signal, 0);
    actions.push('post task abort');
  });

  expect(actions).toEqual([
    'fork start',
    'post fork',
    'pre task abort',
    'fork abort: The operation has been aborted',
    'post task abort',
  ]);

  expect(addEventListenerSpy.callCount).toBe(1);
  expect(removeEventListenerSpy.callCount).toBe(1);
});

it('fork abort on spawn finish', async () => {
  const abortController = new AbortController();
  const signal = abortController.signal;
  const addEventListenerSpy = spyOn(signal, 'addEventListener');
  const removeEventListenerSpy = spyOn(signal, 'removeEventListener');

  const actions: string[] = [];

  await spawn(signal, async (signal, {fork}) => {
    fork(async signal => {
      actions.push('fork start');
      try {
        await forever(signal);
      } catch (err: any) {
        actions.push(`fork abort: ${err.message}`);
      }
    });

    actions.push('post fork');
    await delay(signal, 0);
    actions.push('spawn finish');
  });

  expect(actions).toEqual([
    'fork start',
    'post fork',
    'spawn finish',
    'fork abort: The operation has been aborted',
  ]);

  expect(addEventListenerSpy.callCount).toBe(1);
  expect(removeEventListenerSpy.callCount).toBe(1);
});

it('fork abort on spawn error', async () => {
  const abortController = new AbortController();
  const signal = abortController.signal;
  const addEventListenerSpy = spyOn(signal, 'addEventListener');
  const removeEventListenerSpy = spyOn(signal, 'removeEventListener');

  const actions: string[] = [];

  await spawn(signal, async (signal, {fork}) => {
    fork(async signal => {
      actions.push('fork start');
      try {
        await forever(signal);
      } catch (err: any) {
        actions.push(`fork abort: ${err.message}`);
      }
    });

    actions.push('post fork');
    await delay(signal, 0);
    actions.push('spawn finish');
    throw new Error('the-error');
  }).catch(err => {
    actions.push(`spawn throw: ${err.message}`);
  });

  expect(actions).toEqual([
    'fork start',
    'post fork',
    'spawn finish',
    'fork abort: The operation has been aborted',
    'spawn throw: the-error',
  ]);

  expect(addEventListenerSpy.callCount).toBe(1);
  expect(removeEventListenerSpy.callCount).toBe(1);
});

it('error thrown from fork', async () => {
  const abortController = new AbortController();
  const signal = abortController.signal;
  const addEventListenerSpy = spyOn(signal, 'addEventListener');
  const removeEventListenerSpy = spyOn(signal, 'removeEventListener');

  const actions: string[] = [];

  await spawn(signal, async (signal, {fork}) => {
    fork(async signal => {
      actions.push('fork start');
      await delay(signal, 0);
      actions.push('fork finish');
      throw new Error('the-error');
    });

    actions.push('post fork');

    try {
      await forever(signal);
    } catch (err: any) {
      actions.push(`spawn abort: ${err.message}`);
      throw err;
    }
  }).catch(err => {
    actions.push(`spawn throw: ${err.message}`);
  });

  expect(actions).toEqual([
    'fork start',
    'post fork',
    'fork finish',
    'spawn abort: The operation has been aborted',
    'spawn throw: the-error',
  ]);

  expect(addEventListenerSpy.callCount).toBe(1);
  expect(removeEventListenerSpy.callCount).toBe(1);
});

it('async defer', async () => {
  const abortController = new AbortController();
  const signal = abortController.signal;

  const deferredFn = createSpy(() => {});

  await spawn(signal, async (signal, {defer}) => {
    await delay(signal, 0);

    defer(() => {
      deferredFn();
    });
  });

  expect(deferredFn.callCount).toBe(1);
});

it('abort before spawn', async () => {
  const abortController = new AbortController();
  const signal = abortController.signal;
  const addEventListenerSpy = spyOn(signal, 'addEventListener');
  const removeEventListenerSpy = spyOn(signal, 'removeEventListener');
  abortController.abort();

  const executor = createSpy(async (signal: AbortSignal) => {});

  await expect(spawn(signal, executor)).rejects.toMatchObject({
    name: 'AbortError',
  });

  expect(executor.callCount).toBe(0);

  expect(addEventListenerSpy.callCount).toBe(0);
  expect(removeEventListenerSpy.callCount).toBe(0);
});
