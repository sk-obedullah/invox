/**
 * Customer Domain Model & Zod Validation Schema
 */

import { z } from 'zod';

export const CustomerSchema = z.object({
  id: z.number().optional(),
  name: z.string().min(1, 'Customer name is required').max(200),
  email: z.string().email('Invalid email address').optional().or(z.literal('')).default(''),
  phone: z.string().optional().default(''),
  address: z.string().optional().default(''),
  city: z.string().optional().default(''),
  state: z.string().optional().default(''),
  zip_code: z.string().optional().default(''),
  gstin: z.string().optional().default(''),
  notes: z.string().optional().default(''),
});

/**
 * Create a blank customer
 */
export const createEmptyCustomer = () => ({
  name: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  state: '',
  zip_code: '',
  gstin: '',
  notes: '',
});

/**
 * Format customer display name with city
 */
export const formatCustomerDisplay = (customer) => {
  if (!customer) return '';
  let display = customer.name;
  if (customer.city) display += `, ${customer.city}`;
  return display;
};

/**
 * Format full customer address
 */
export const formatCustomerAddress = (customer) => {
  if (!customer) return '';
  const parts = [
    customer.address,
    customer.city,
    customer.state,
    customer.zip_code,
  ].filter(Boolean);
  return parts.join(', ');
};
