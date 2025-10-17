import {spawn} from './spawn';
import {forever} from './forever';
import {delay} from './delay';

test('fork manual abort', async () => {
  const abortController = new AbortController();
  const signal = abortController.signal;
  signal.addEventListener = jest.fn(signal.addEventListener);
  signal.removeEventListener = jest.fn(signal.removeEventListener);

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

  expect(actions).toMatchInlineSnapshot(`
    Array [
      "fork start",
      "post fork",
      "pre task abort",
      "fork abort: This operation was aborted",
      "post task abort",
    ]
  `);

  expect(signal.addEventListener).toHaveBeenCalledTimes(1);
  expect(signal.removeEventListener).toHaveBeenCalledTimes(1);
});

test('fork abort on spawn finish', async () => {
  const abortController = new AbortController();
  const signal = abortController.signal;
  signal.addEventListener = jest.fn(signal.addEventListener);
  signal.removeEventListener = jest.fn(signal.removeEventListener);

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

  expect(actions).toMatchInlineSnapshot(`
    Array [
      "fork start",
      "post fork",
      "spawn finish",
      "fork abort: This operation was aborted",
    ]
  `);

  expect(signal.addEventListener).toHaveBeenCalledTimes(1);
  expect(signal.removeEventListener).toHaveBeenCalledTimes(1);
});

test('fork abort on spawn error', async () => {
  const abortController = new AbortController();
  const signal = abortController.signal;
  signal.addEventListener = jest.fn(signal.addEventListener);
  signal.removeEventListener = jest.fn(signal.removeEventListener);

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

  expect(actions).toMatchInlineSnapshot(`
    Array [
      "fork start",
      "post fork",
      "spawn finish",
      "fork abort: This operation was aborted",
      "spawn throw: the-error",
    ]
  `);

  expect(signal.addEventListener).toHaveBeenCalledTimes(1);
  expect(signal.removeEventListener).toHaveBeenCalledTimes(1);
});

test('error thrown from fork', async () => {
  const abortController = new AbortController();
  const signal = abortController.signal;
  signal.addEventListener = jest.fn(signal.addEventListener);
  signal.removeEventListener = jest.fn(signal.removeEventListener);

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

  expect(actions).toMatchInlineSnapshot(`
    Array [
      "fork start",
      "post fork",
      "fork finish",
      "spawn abort: This operation was aborted",
      "spawn throw: the-error",
    ]
  `);

  expect(signal.addEventListener).toHaveBeenCalledTimes(1);
  expect(signal.removeEventListener).toHaveBeenCalledTimes(1);
});

test('async defer', async () => {
  const abortController = new AbortController();
  const signal = abortController.signal;

  const deferredFn = jest.fn();

  await spawn(signal, async (signal, {defer}) => {
    await delay(signal, 0);

    defer(() => {
      deferredFn();
    });
  });

  expect(deferredFn).toHaveBeenCalledTimes(1);
});

test('abort before spawn', async () => {
  const abortController = new AbortController();
  const signal = abortController.signal;
  signal.addEventListener = jest.fn(signal.addEventListener);
  signal.removeEventListener = jest.fn(signal.removeEventListener);
  abortController.abort();

  const executor = jest.fn(async (signal: AbortSignal) => {});

  await expect(spawn(signal, executor)).rejects.toMatchObject({
    name: 'AbortError',
  });

  expect(executor).not.toHaveBeenCalled();

  expect(signal.addEventListener).not.toHaveBeenCalled();
  expect(signal.removeEventListener).not.toHaveBeenCalled();
});

test('abort with custom reason during spawn execution', async () => {
  const abortController = new AbortController();
  const signal = abortController.signal;

  const customReason = new Error('Custom abort reason');
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
    actions.push('pre abort');
    abortController.abort(customReason);
    await delay(signal, 0);
  }).catch(err => {
    actions.push(`spawn catch: ${err.message || err.toString()}`);
  });

  expect(actions).toContain('fork start');
  expect(actions).toContain('post fork');
  expect(actions).toContain('pre abort');
  expect(actions).toContain('fork abort: This operation was aborted');
});

test('innerSignal aborted on spawn finish', async () => {
  const abortController = new AbortController();
  const signal = abortController.signal;

  let innerSignal: AbortSignal | undefined;

  await spawn(signal, async (signal, {fork}) => {
    innerSignal = signal;
    fork(async signal => {
      await forever(signal).catch(() => {});
    });

    await delay(signal, 0);
  });

  expect(innerSignal!.aborted).toBe(true);
});

test('innerSignal aborted on fork error', async () => {
  const abortController = new AbortController();
  const signal = abortController.signal;

  let innerSignal: AbortSignal | undefined;

  await spawn(signal, async (signal, {fork}) => {
    innerSignal = signal;
    fork(async signal => {
      await delay(signal, 0);
      throw new Error('fork-error');
    });

    await forever(signal).catch(() => {});
  }).catch(() => {});

  expect(innerSignal!.aborted).toBe(true);
});

test('innerSignal aborted when spawn function throws', async () => {
  const abortController = new AbortController();
  const signal = abortController.signal;

  let innerSignal: AbortSignal | undefined;
  const spawnError = new Error('spawn-error');

  await spawn(signal, async (signal, {fork}) => {
    innerSignal = signal;
    fork(async signal => {
      await forever(signal).catch(() => {});
    });

    await delay(signal, 0);
    throw spawnError;
  }).catch(() => {});

  expect(innerSignal!.aborted).toBe(true);
});
