/**
 * Settings Domain Model & Zod Validation Schema
 */

import { z } from 'zod';

export const SettingsSchema = z.object({
  company_name: z.string().max(200).default(''),
  company_address: z.string().max(500).default(''),
  company_phone: z.string().max(20).default(''),
  company_email: z.string().email('Invalid email').optional().or(z.literal('')).default(''),
  company_logo_path: z.string().default(''),
  default_currency: z.string().default('INR'),
  default_tax_rate: z.number().min(0).max(100).default(18),
  invoice_prefix: z.string().min(1).max(10).default('INV'),
  next_invoice_number: z.number().min(1).default(1001),
  default_notes: z.string().default(''),
  default_terms: z.string().default('Payment is due within 30 days of invoice date.'),
  template: z.string().default('modern'),
  theme: z.enum(['light', 'dark', 'system']).default('system'),
});

export const DEFAULT_SETTINGS = {
  company_name: '',
  company_address: '',
  company_phone: '',
  company_email: '',
  company_logo_path: '',
  default_currency: 'INR',
  default_tax_rate: 18,
  invoice_prefix: 'INV',
  next_invoice_number: 1001,
  default_notes: '',
  default_terms: 'Payment is due within 30 days of invoice date.',
  template: 'modern',
  theme: 'system',
};
