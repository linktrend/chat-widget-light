import {generateId, noop, nowAsISOString} from './utils';

describe('utils', () => {
  it('noop returns undefined', () => {
    expect(noop()).toBeUndefined();
  });

  it('generateId returns unique strings', () => {
    const first = generateId();
    const second = generateId();

    expect(typeof first).toBe('string');
    expect(first).not.toEqual(second);
  });

  it('nowAsISOString returns a valid ISO date string', () => {
    const value = nowAsISOString();

    expect(() => new Date(value).toISOString()).not.toThrow();
  });
});
