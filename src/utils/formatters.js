/**
 * Utility: Formatters
 * Number, currency, and date formatting
 */

import dayjs from 'dayjs';
import { getCurrencyByCode } from '../constants/currencies';

/**
 * Format a number as currency
 */
export const formatCurrency = (amount, currencyCode = 'INR') => {
  const currency = getCurrencyByCode(currencyCode);
  const num = parseFloat(amount) || 0;

  try {
    return new Intl.NumberFormat(currency.locale, {
      style: 'currency',
      currency: currency.code,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  } catch {
    return `${currency.symbol}${num.toFixed(2)}`;
  }
};

/**
 * Format a number with commas
 */
export const formatNumber = (num, decimals = 2) => {
  const n = parseFloat(num) || 0;
  return n.toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};

/**
 * Format date for display
 */
export const formatDate = (date, format = 'DD MMM YYYY') => {
  if (!date) return '';
  return dayjs(date).format(format);
};

/**
 * Format date for storage (ISO)
 */
export const toISODate = (date) => {
  return dayjs(date).format('YYYY-MM-DD');
};

/**
 * Format relative time
 */
export const formatRelativeTime = (date) => {
  if (!date) return '';
  const d = dayjs(date);
  const now = dayjs();
  const diff = now.diff(d, 'day');

  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  if (diff < 7) return `${diff} days ago`;
  if (diff < 30) return `${Math.floor(diff / 7)} weeks ago`;
  return d.format('DD MMM YYYY');
};

/**
 * Truncate text with ellipsis
 */
export const truncate = (text, maxLength = 30) => {
  if (!text || text.length <= maxLength) return text || '';
  return text.substring(0, maxLength).trim() + '…';
};

/**
 * Format phone number
 */
export const formatPhone = (phone) => {
  if (!phone) return '';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
  }
  return phone;
};

/**
 * Format file size
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};
