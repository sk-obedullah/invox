/**
 * Invoice Status Constants
 */

export const INVOICE_STATUS = {
  DRAFT: 'draft',
  SENT: 'sent',
  PAID: 'paid',
  OVERDUE: 'overdue',
  CANCELLED: 'cancelled',
};

export const INVOICE_STATUS_LABELS = {
  [INVOICE_STATUS.DRAFT]: 'Draft',
  [INVOICE_STATUS.SENT]: 'Sent',
  [INVOICE_STATUS.PAID]: 'Paid',
  [INVOICE_STATUS.OVERDUE]: 'Overdue',
  [INVOICE_STATUS.CANCELLED]: 'Cancelled',
};

export const INVOICE_STATUS_LIST = [
  { value: INVOICE_STATUS.DRAFT, label: 'Draft' },
  { value: INVOICE_STATUS.SENT, label: 'Sent' },
  { value: INVOICE_STATUS.PAID, label: 'Paid' },
  { value: INVOICE_STATUS.OVERDUE, label: 'Overdue' },
  { value: INVOICE_STATUS.CANCELLED, label: 'Cancelled' },
];
