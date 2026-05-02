/**
 * Invoice Domain Model & Zod Validation Schema
 */

import { z } from 'zod';

export const LineItemSchema = z.object({
  id: z.number().optional(),
  name: z.string().min(1, 'Item name is required'),
  description: z.string().optional().default(''),
  quantity: z.number().min(0.01, 'Quantity must be greater than 0').default(1),
  unit_price: z.number().min(0, 'Price must be 0 or more').default(0),
  tax_rate: z.number().min(0).max(100).default(0),
  tax_amount: z.number().default(0),
  amount: z.number().default(0),
  sort_order: z.number().default(0),
});

export const InvoiceSchema = z.object({
  id: z.number().optional(),
  invoice_number: z.string().min(1, 'Invoice number is required'),
  customer_id: z.number().nullable().optional(),
  customer_name: z.string().optional().default(''),
  customer_email: z.string().email('Invalid email').optional().or(z.literal('')).default(''),
  customer_phone: z.string().optional().default(''),
  customer_address: z.string().optional().default(''),
  status: z.enum(['draft', 'sent', 'paid', 'overdue', 'cancelled']).default('draft'),
  issue_date: z.string().min(1, 'Issue date is required'),
  due_date: z.string().optional().nullable(),
  subtotal: z.number().default(0),
  tax_rate: z.number().min(0).max(100).default(0),
  tax_amount: z.number().default(0),
  discount: z.number().min(0).default(0),
  discount_type: z.enum(['fixed', 'percentage']).default('fixed'),
  total: z.number().default(0),
  currency: z.string().default('INR'),
  notes: z.string().optional().default(''),
  terms: z.string().optional().default(''),
  line_items: z.array(LineItemSchema).min(1, 'At least one item is required'),
});

/**
 * Create a blank invoice with default values
 */
export const createEmptyInvoice = (defaults = {}) => ({
  invoice_number: '',
  customer_id: null,
  customer_name: '',
  customer_email: '',
  customer_phone: '',
  customer_address: '',
  status: 'draft',
  issue_date: (() => {
    const d = new Date();
    const pad = n => n < 10 ? '0'+n : n;
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  })(),
  due_date: '',
  subtotal: 0,
  tax_rate: defaults.default_tax_rate || 0,
  tax_amount: 0,
  discount: 0,
  discount_type: 'fixed',
  total: 0,
  currency: defaults.default_currency || 'INR',
  notes: defaults.default_notes || '',
  terms: defaults.default_terms || '',
  line_items: [createEmptyLineItem()],
  ...defaults,
});

/**
 * Create a blank line item
 */
export const createEmptyLineItem = (sortOrder = 0) => ({
  name: '',
  description: '',
  quantity: 1,
  unit_price: 0,
  tax_rate: 0,
  tax_amount: 0,
  amount: 0,
  sort_order: sortOrder,
});
