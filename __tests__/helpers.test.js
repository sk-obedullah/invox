/**
 * Unit tests for helper utilities
 */

import {
  generateId,
  isEmpty,
  getInitials,
  stringToColor,
  safeJsonParse,
  deepClone,
} from '../src/utils/helpers';

describe('generateId', () => {
  it('should generate valid UUID v4 format', () => {
    const id = generateId();
    expect(id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
    );
  });

  it('should generate unique IDs', () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateId()));
    expect(ids.size).toBe(100);
  });
});

describe('isEmpty', () => {
  it('should detect empty values', () => {
    expect(isEmpty(null)).toBe(true);
    expect(isEmpty('')).toBe(true);
    expect(isEmpty('  ')).toBe(true);
    expect(isEmpty([])).toBe(true);
    expect(isEmpty({})).toBe(true);
  });

  it('should detect non-empty values', () => {
    expect(isEmpty('hello')).toBe(false);
    expect(isEmpty([1])).toBe(false);
    expect(isEmpty({ a: 1 })).toBe(false);
  });
});

describe('getInitials', () => {
  it('should get initials from full name', () => {
    expect(getInitials('John Doe')).toBe('JD');
    expect(getInitials('Alice Bob Charlie')).toBe('AC');
  });

  it('should handle single name', () => {
    expect(getInitials('Alice')).toBe('A');
  });

  it('should handle empty/null', () => {
    expect(getInitials(null)).toBe('?');
    expect(getInitials('')).toBe('?');
  });
});

describe('stringToColor', () => {
  it('should return a hex color', () => {
    const color = stringToColor('test');
    expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/);
  });

  it('should return consistent color for same input', () => {
    expect(stringToColor('abc')).toBe(stringToColor('abc'));
  });

  it('should return default for null', () => {
    expect(stringToColor(null)).toBe('#6366F1');
  });
});

describe('safeJsonParse', () => {
  it('should parse valid JSON', () => {
    expect(safeJsonParse('{"a":1}')).toEqual({ a: 1 });
  });

  it('should return fallback for invalid JSON', () => {
    expect(safeJsonParse('not json', [])).toEqual([]);
  });
});

describe('deepClone', () => {
  it('should create a deep copy', () => {
    const original = { a: { b: [1, 2, 3] } };
    const clone = deepClone(original);
    clone.a.b.push(4);
    expect(original.a.b.length).toBe(3);
    expect(clone.a.b.length).toBe(4);
  });
});
