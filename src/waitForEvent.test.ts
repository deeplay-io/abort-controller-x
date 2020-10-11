import {AbortController} from 'abort-controller';
import {Event} from 'event-target-shim';
import {nextTick} from './utils/nextTick';
import {waitForEvent} from './waitForEvent';

test('external abort', async () => {
  const abortController = new AbortController();
  const signal = abortController.signal;
  signal.addEventListener = jest.fn(signal.addEventListener);
  signal.removeEventListener = jest.fn(signal.removeEventListener);

  const eventTarget = new AbortController().signal;
  eventTarget.removeEventListener = jest.fn(eventTarget.removeEventListener);

  let result: PromiseSettledResult<Event> | undefined;

  waitForEvent(signal, eventTarget, 'test').then(
    value => {
      result = {status: 'fulfilled', value};
    },
    reason => {
      result = {status: 'rejected', reason};
    },
  );

  expect(eventTarget.removeEventListener).toHaveBeenCalledTimes(0);

  abortController.abort();

  await nextTick();

  expect(result).toMatchObject({
    status: 'rejected',
    reason: {name: 'AbortError'},
  });
  expect(eventTarget.removeEventListener).toHaveBeenCalledTimes(1);

  expect(signal.addEventListener).toHaveBeenCalledTimes(1);
  expect(signal.removeEventListener).toHaveBeenCalledTimes(1);
});

test('fulfill', async () => {
  const abortController = new AbortController();
  const signal = abortController.signal;
  signal.addEventListener = jest.fn(signal.addEventListener);
  signal.removeEventListener = jest.fn(signal.removeEventListener);

  const eventTarget = new AbortController().signal;
  eventTarget.removeEventListener = jest.fn(eventTarget.removeEventListener);

  let result: PromiseSettledResult<Event> | undefined;

  waitForEvent(signal, eventTarget, 'test').then(
    value => {
      result = {status: 'fulfilled', value};
    },
    reason => {
      result = {status: 'rejected', reason};
    },
  );

  eventTarget.dispatchEvent({type: 'test'});

  await nextTick();

  expect(result).toMatchObject({
    status: 'fulfilled',
    value: {type: 'test'},
  });
  expect(eventTarget.removeEventListener).toHaveBeenCalledTimes(1);

  expect(signal.addEventListener).toHaveBeenCalledTimes(1);
  expect(signal.removeEventListener).toHaveBeenCalledTimes(1);
});
