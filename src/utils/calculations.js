/**
 * Utility: Calculations
 * All invoice math operations
 */

/**
 * Calculate a single line item's amount and tax
 */
export const calculateLineItem = (item) => {
  const quantity = parseFloat(item.quantity) || 0;
  const unitPrice = parseFloat(item.unit_price) || 0;
  const taxRate = parseFloat(item.tax_rate) || 0;

  const baseAmount = quantity * unitPrice;
  const taxAmount = (baseAmount * taxRate) / 100;
  const amount = baseAmount + taxAmount;

  return {
    ...item,
    tax_amount: Math.round(taxAmount * 100) / 100,
    amount: Math.round(amount * 100) / 100,
  };
};

/**
 * Calculate invoice totals from line items
 */
export const calculateInvoiceTotals = (lineItems, discount = 0, discountType = 'fixed') => {
  const calculatedItems = lineItems.map(calculateLineItem);

  const subtotal = calculatedItems.reduce((sum, item) => {
    const qty = parseFloat(item.quantity) || 0;
    const price = parseFloat(item.unit_price) || 0;
    return sum + qty * price;
  }, 0);

  const totalTax = calculatedItems.reduce((sum, item) => {
    return sum + (parseFloat(item.tax_amount) || 0);
  }, 0);

  let discountAmount = 0;
  if (discountType === 'percentage') {
    discountAmount = (subtotal * (parseFloat(discount) || 0)) / 100;
  } else {
    discountAmount = parseFloat(discount) || 0;
  }

  const total = subtotal + totalTax - discountAmount;

  return {
    line_items: calculatedItems,
    subtotal: Math.round(subtotal * 100) / 100,
    tax_amount: Math.round(totalTax * 100) / 100,
    discount: Math.round(discountAmount * 100) / 100,
    total: Math.round(Math.max(total, 0) * 100) / 100,
  };
};

/**
 * Calculate weighted average tax rate
 */
export const calculateAverageTaxRate = (lineItems) => {
  if (lineItems.length === 0) return 0;

  const totalBase = lineItems.reduce((sum, item) => {
    return sum + (parseFloat(item.quantity) || 0) * (parseFloat(item.unit_price) || 0);
  }, 0);

  if (totalBase === 0) return 0;

  const totalTax = lineItems.reduce((sum, item) => {
    const base = (parseFloat(item.quantity) || 0) * (parseFloat(item.unit_price) || 0);
    return sum + (base * (parseFloat(item.tax_rate) || 0)) / 100;
  }, 0);

  return Math.round((totalTax / totalBase) * 100 * 100) / 100;
};
