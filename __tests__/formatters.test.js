/**
 * Unit tests for formatter utilities
 */

import {
  formatNumber,
  formatDate,
  formatRelativeTime,
  truncate,
  formatPhone,
  formatFileSize,
} from '../src/utils/formatters';

describe('formatNumber', () => {
  it('should format with 2 decimals', () => {
    expect(formatNumber(1234.5)).toContain('1,234.50');
  });

  it('should handle zero', () => {
    expect(formatNumber(0)).toContain('0.00');
  });

  it('should handle NaN input', () => {
    expect(formatNumber('abc')).toContain('0.00');
  });
});

describe('truncate', () => {
  it('should truncate long text', () => {
    const result = truncate('This is a very long string that needs truncation', 20);
    expect(result.length).toBeLessThanOrEqual(21); // 20 + ellipsis
    expect(result).toContain('…');
  });

  it('should not truncate short text', () => {
    expect(truncate('Short', 20)).toBe('Short');
  });

  it('should handle empty/null input', () => {
    expect(truncate(null)).toBe('');
    expect(truncate('')).toBe('');
  });
});

describe('formatPhone', () => {
  it('should format 10-digit number', () => {
    expect(formatPhone('9876543210')).toBe('98765 43210');
  });

  it('should return original for non-10-digit', () => {
    expect(formatPhone('+1-555-1234')).toBe('+1-555-1234');
  });
});

describe('formatFileSize', () => {
  it('should format bytes', () => {
    expect(formatFileSize(0)).toBe('0 B');
    expect(formatFileSize(1024)).toBe('1 KB');
    expect(formatFileSize(1048576)).toBe('1 MB');
  });
});
