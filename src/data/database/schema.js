/**
 * SQLite Database Schema
 * Defines all tables, indexes, and migrations
 */

export const SCHEMA_VERSION = 1;

export const CREATE_TABLES = [
  // Settings table
  `CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_name TEXT DEFAULT '',
    company_address TEXT DEFAULT '',
    company_phone TEXT DEFAULT '',
    company_email TEXT DEFAULT '',
    company_logo_path TEXT DEFAULT '',
    default_currency TEXT DEFAULT 'INR',
    default_tax_rate REAL DEFAULT 18.0,
    invoice_prefix TEXT DEFAULT 'INV',
    next_invoice_number INTEGER DEFAULT 1001,
    default_notes TEXT DEFAULT '',
    default_terms TEXT DEFAULT 'Payment is due within 30 days of invoice date.',
    template TEXT DEFAULT 'modern',
    theme TEXT DEFAULT 'system',
    bank_account_name TEXT DEFAULT '',
    bank_account_no TEXT DEFAULT '',
    bank_ifsc TEXT DEFAULT '',
    bank_branch TEXT DEFAULT '',
    bank_mobile TEXT DEFAULT '',
    upi_id TEXT DEFAULT '',
    thanks_note TEXT DEFAULT 'Thank you for your business!',
    qr_code_path TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );`,

  // Customers table
  `CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT DEFAULT '',
    phone TEXT DEFAULT '',
    address TEXT DEFAULT '',
    city TEXT DEFAULT '',
    state TEXT DEFAULT '',
    zip_code TEXT DEFAULT '',
    gstin TEXT DEFAULT '',
    notes TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );`,

  // Invoices table
  `CREATE TABLE IF NOT EXISTS invoices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    invoice_number TEXT NOT NULL UNIQUE,
    customer_id INTEGER,
    customer_name TEXT DEFAULT '',
    customer_email TEXT DEFAULT '',
    customer_phone TEXT DEFAULT '',
    customer_address TEXT DEFAULT '',
    status TEXT DEFAULT 'draft',
    issue_date TEXT NOT NULL,
    due_date TEXT,
    subtotal REAL DEFAULT 0,
    tax_rate REAL DEFAULT 0,
    tax_amount REAL DEFAULT 0,
    discount REAL DEFAULT 0,
    discount_type TEXT DEFAULT 'fixed',
    total REAL DEFAULT 0,
    currency TEXT DEFAULT 'INR',
    notes TEXT DEFAULT '',
    terms TEXT DEFAULT '',
    pdf_path TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL
  );`,

  // Line items table
  `CREATE TABLE IF NOT EXISTS line_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    invoice_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    quantity REAL DEFAULT 1,
    unit_price REAL DEFAULT 0,
    tax_rate REAL DEFAULT 0,
    tax_amount REAL DEFAULT 0,
    amount REAL DEFAULT 0,
    sort_order INTEGER DEFAULT 0,
    FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
  );`,

  // Predefined Items table
  `CREATE TABLE IF NOT EXISTS items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    unit_price REAL DEFAULT 0,
    tax_rate REAL DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );`,
];

export const CREATE_INDEXES = [
  'CREATE INDEX IF NOT EXISTS idx_invoices_customer_id ON invoices(customer_id);',
  'CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);',
  'CREATE INDEX IF NOT EXISTS idx_invoices_issue_date ON invoices(issue_date);',
  'CREATE INDEX IF NOT EXISTS idx_invoices_invoice_number ON invoices(invoice_number);',
  'CREATE INDEX IF NOT EXISTS idx_line_items_invoice_id ON line_items(invoice_id);',
  'CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name);',
  'CREATE INDEX IF NOT EXISTS idx_items_name ON items(name);',
];

export const INSERT_DEFAULT_SETTINGS = `
  INSERT OR IGNORE INTO settings (id, company_name) VALUES (1, '');
`;
