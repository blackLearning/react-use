import { act, renderHook, RenderHookResult } from '@testing-library/react-hooks';
import { useTimeoutFn } from '../index';
import { UseTimeoutFnReturn } from '../useTimeoutFn';

describe('useTimeoutFn', () => {
  beforeAll(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  it('should be defined', () => {
    expect(useTimeoutFn).toBeDefined();
  });

  it('should return three functions', () => {
    const hook = renderHook(() => useTimeoutFn(() => {}, 5));

    expect(hook.result.current.length).toBe(3);
    expect(typeof hook.result.current[0]).toBe('function');
    expect(typeof hook.result.current[1]).toBe('function');
    expect(typeof hook.result.current[2]).toBe('function');
  });

  function getHook(ms: number = 5): [jest.Mock, RenderHookResult<{ delay: number }, UseTimeoutFnReturn>] {
    const spy = jest.fn();
    return [spy, renderHook(({ delay = 5 }) => useTimeoutFn(spy, delay), { initialProps: { delay: ms } })];
  }

  it('should call passed function after given amount of time', () => {
    const [spy] = getHook();

    expect(spy).not.toHaveBeenCalled();
    jest.advanceTimersByTime(5);
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('should cancel function call on unmount', () => {
    const [spy, hook] = getHook();

    expect(spy).not.toHaveBeenCalled();
    hook.unmount();
    jest.advanceTimersByTime(5);
    expect(spy).not.toHaveBeenCalled();
  });

  it('first function should return actual state of timeout', () => {
    let [, hook] = getHook();
    let [isReady] = hook.result.current;

    expect(isReady()).toBe(false);
    hook.unmount();
    expect(isReady()).toBe(null);

    [, hook] = getHook();
    [isReady] = hook.result.current;
    jest.advanceTimersByTime(5);
    expect(isReady()).toBe(true);
  });

  it('second function should cancel timeout', () => {
    const [spy, hook] = getHook();
    const [isReady, cancel] = hook.result.current;

    expect(spy).not.toHaveBeenCalled();
    expect(isReady()).toBe(false);

    act(() => {
      cancel();
    });
    jest.advanceTimersByTime(5);

    expect(spy).not.toHaveBeenCalled();
    expect(isReady()).toBe(null);
  });

  it('third function should reset timeout', () => {
    const [spy, hook] = getHook();
    const [isReady, cancel, reset] = hook.result.current;

    expect(isReady()).toBe(false);

    act(() => {
      cancel();
    });
    jest.advanceTimersByTime(5);

    expect(isReady()).toBe(null);

    act(() => {
      reset();
    });
    expect(isReady()).toBe(false);

    jest.advanceTimersByTime(5);

    expect(spy).toHaveBeenCalledTimes(1);
    expect(isReady()).toBe(true);
  });

  it('should reset timeout on delay change', () => {
    const [spy, hook] = getHook(50);

    expect(spy).not.toHaveBeenCalled();
    hook.rerender({ delay: 5 });

    jest.advanceTimersByTime(5);
    expect(spy).toHaveBeenCalledTimes(1);
  });
});
