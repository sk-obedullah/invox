/**
 * Unit tests for calculation utilities
 */

import {
  calculateLineItem,
  calculateInvoiceTotals,
  calculateAverageTaxRate,
} from '../src/utils/calculations';

describe('calculateLineItem', () => {
  it('should calculate basic amount without tax', () => {
    const item = { quantity: 2, unit_price: 100, tax_rate: 0 };
    const result = calculateLineItem(item);
    expect(result.amount).toBe(200);
    expect(result.tax_amount).toBe(0);
  });

  it('should calculate amount with tax', () => {
    const item = { quantity: 3, unit_price: 100, tax_rate: 18 };
    const result = calculateLineItem(item);
    expect(result.tax_amount).toBe(54);
    expect(result.amount).toBe(354);
  });

  it('should handle zero quantity', () => {
    const item = { quantity: 0, unit_price: 100, tax_rate: 10 };
    const result = calculateLineItem(item);
    expect(result.amount).toBe(0);
  });

  it('should handle decimal quantities', () => {
    const item = { quantity: 2.5, unit_price: 40, tax_rate: 0 };
    const result = calculateLineItem(item);
    expect(result.amount).toBe(100);
  });

  it('should handle string inputs gracefully', () => {
    const item = { quantity: '3', unit_price: '50', tax_rate: '10' };
    const result = calculateLineItem(item);
    expect(result.amount).toBe(165);
    expect(result.tax_amount).toBe(15);
  });
});

describe('calculateInvoiceTotals', () => {
  const items = [
    { name: 'Item A', quantity: 2, unit_price: 100, tax_rate: 18 },
    { name: 'Item B', quantity: 1, unit_price: 500, tax_rate: 18 },
  ];

  it('should calculate totals correctly', () => {
    const result = calculateInvoiceTotals(items);
    expect(result.subtotal).toBe(700);
    expect(result.tax_amount).toBe(126);
    expect(result.total).toBe(826);
  });

  it('should apply fixed discount', () => {
    const result = calculateInvoiceTotals(items, 50, 'fixed');
    expect(result.discount).toBe(50);
    expect(result.total).toBe(776);
  });

  it('should apply percentage discount', () => {
    const result = calculateInvoiceTotals(items, 10, 'percentage');
    expect(result.discount).toBe(70);
    expect(result.total).toBe(756);
  });

  it('should handle empty line items', () => {
    const result = calculateInvoiceTotals([]);
    expect(result.subtotal).toBe(0);
    expect(result.total).toBe(0);
  });

  it('should not go below zero total', () => {
    const result = calculateInvoiceTotals(items, 10000, 'fixed');
    expect(result.total).toBe(0);
  });
});

describe('calculateAverageTaxRate', () => {
  it('should calculate weighted average tax rate', () => {
    const items = [
      { quantity: 1, unit_price: 100, tax_rate: 5 },
      { quantity: 1, unit_price: 100, tax_rate: 18 },
    ];
    const rate = calculateAverageTaxRate(items);
    expect(rate).toBe(11.5);
  });

  it('should return 0 for empty items', () => {
    expect(calculateAverageTaxRate([])).toBe(0);
  });
});
