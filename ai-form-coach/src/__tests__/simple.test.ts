import { describe, it, expect } from 'vitest';

describe('Simple Test Suite', () => {
  it('should pass basic math test', () => {
    expect(2 + 2).toBe(4);
  });

  it('should pass string test', () => {
    expect('hello').toBe('hello');
  });

  it('should pass array test', () => {
    expect([1, 2, 3]).toHaveLength(3);
  });

  it('should pass object test', () => {
    const obj = { name: 'test', value: 42 };
    expect(obj).toHaveProperty('name');
    expect(obj.name).toBe('test');
  });
});
