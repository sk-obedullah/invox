/**
 * Invoice Repository
 * Data access layer for invoices and line items
 */

import db from '../database/DatabaseManager';

class InvoiceRepository {
  /**
   * Create a new invoice with line items (transaction)
   */
  async create(invoice, lineItems = []) {

    
    const result = await db.executeSql(
      `INSERT INTO invoices (
        invoice_number, customer_id, customer_name, customer_email,
        customer_phone, customer_address, status, issue_date, due_date,
        subtotal, tax_rate, tax_amount, discount, discount_type,
        total, currency, notes, terms
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        invoice.invoice_number,
        invoice.customer_id || null,
        invoice.customer_name || '',
        invoice.customer_email || '',
        invoice.customer_phone || '',
        invoice.customer_address || '',
        invoice.status || 'draft',
        invoice.issue_date,
        invoice.due_date || null,
        Number(invoice.subtotal) || 0,
        Number(invoice.tax_rate) || 0,
        Number(invoice.tax_amount) || 0,
        Number(invoice.discount) || 0,
        invoice.discount_type || 'fixed',
        Number(invoice.total) || 0,
        invoice.currency || 'INR',
        invoice.notes || '',
        invoice.terms || '',
      ]
    );

    const createdInvoiceId = result.insertId;


    if (lineItems.length > 0) {

      const itemQueries = lineItems.map((item, index) => ({
        sql: `INSERT INTO line_items (
          invoice_id, name, description, quantity,
          unit_price, tax_rate, tax_amount, amount, sort_order
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        params: [
          createdInvoiceId,
          item.name,
          item.description || '',
          Number(item.quantity) || 1,
          Number(item.unit_price) || 0,
          Number(item.tax_rate) || 0,
          Number(item.tax_amount) || 0,
          Number(item.amount) || 0,
          item.sort_order || index,
        ],
      }));

      await db.executeTransaction(itemQueries);

    }

    return createdInvoiceId;
  }

  /**
   * Update an existing invoice and its line items
   */
  async update(invoiceId, invoice, lineItems = []) {


    await db.executeSql(
      `UPDATE invoices SET
        invoice_number = ?, customer_id = ?, customer_name = ?,
        customer_email = ?, customer_phone = ?, customer_address = ?,
        status = ?, issue_date = ?, due_date = ?,
        subtotal = ?, tax_rate = ?, tax_amount = ?,
        discount = ?, discount_type = ?, total = ?,
        currency = ?, notes = ?, terms = ?,
        updated_at = datetime('now')
      WHERE id = ?`,
      [
        invoice.invoice_number,
        invoice.customer_id || null,
        invoice.customer_name || '',
        invoice.customer_email || '',
        invoice.customer_phone || '',
        invoice.customer_address || '',
        invoice.status || 'draft',
        invoice.issue_date,
        invoice.due_date || null,
        Number(invoice.subtotal) || 0,
        Number(invoice.tax_rate) || 0,
        Number(invoice.tax_amount) || 0,
        Number(invoice.discount) || 0,
        invoice.discount_type || 'fixed',
        Number(invoice.total) || 0,
        invoice.currency || 'INR',
        invoice.notes || '',
        invoice.terms || '',
        invoiceId,
      ]
    );

    // Delete and re-insert line items

    
    const queries = [
      { sql: 'DELETE FROM line_items WHERE invoice_id = ?', params: [invoiceId] },
      ...lineItems.map((item, index) => ({
        sql: `INSERT INTO line_items (
          invoice_id, name, description, quantity,
          unit_price, tax_rate, tax_amount, amount, sort_order
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        params: [
          invoiceId,
          item.name,
          item.description || '',
          Number(item.quantity) || 1,
          Number(item.unit_price) || 0,
          Number(item.tax_rate) || 0,
          Number(item.tax_amount) || 0,
          Number(item.amount) || 0,
          item.sort_order || index,
        ],
      })),
    ];

    await db.executeTransaction(queries);

    return true;
  }

  /**
   * Get a single invoice with its line items
   */
  async getById(id) {
    const result = await db.executeSql(
      'SELECT * FROM invoices WHERE id = ?',
      [id]
    );

    if (result.rows.length === 0) return null;

    const invoice = { ...result.rows.item(0) };

    const itemsResult = await db.executeSql(
      'SELECT * FROM line_items WHERE invoice_id = ? ORDER BY sort_order ASC',
      [id]
    );


    invoice.line_items = [];
    for (let i = 0; i < itemsResult.rows.length; i++) {
      invoice.line_items.push(itemsResult.rows.item(i));
    }

    return invoice;
  }

  /**
   * Get paginated invoices with optional filters
   */
  async getAll({ page = 1, limit = 20, status, search, startDate, endDate, sortBy = 'created_at', sortOrder = 'DESC' } = {}) {
    let query = 'SELECT * FROM invoices WHERE 1=1';
    let countQuery = 'SELECT COUNT(*) as total FROM invoices WHERE 1=1';
    const params = [];
    const countParams = [];

    if (status) {
      const clause = ' AND status = ?';
      query += clause;
      countQuery += clause;
      params.push(status);
      countParams.push(status);
    }

    if (search) {
      const clause = ' AND (invoice_number LIKE ? OR customer_name LIKE ?)';
      query += clause;
      countQuery += clause;
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam);
      countParams.push(searchParam, searchParam);
    }

    if (startDate) {
      const clause = ' AND issue_date >= ?';
      query += clause;
      countQuery += clause;
      params.push(startDate);
      countParams.push(startDate);
    }

    if (endDate) {
      const clause = ' AND issue_date <= ?';
      query += clause;
      countQuery += clause;
      params.push(endDate);
      countParams.push(endDate);
    }

    // Count total
    const countResult = await db.executeSql(countQuery, countParams);
    const total = countResult.rows.item(0).total;

    // Get paginated results
    const allowedSortFields = ['created_at', 'issue_date', 'total', 'invoice_number', 'customer_name'];
    const safeSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'created_at';
    const safeSortOrder = sortOrder === 'ASC' ? 'ASC' : 'DESC';

    query += ` ORDER BY ${safeSortBy} ${safeSortOrder}`;
    query += ' LIMIT ? OFFSET ?';
    params.push(limit, (page - 1) * limit);

    const result = await db.executeSql(query, params);
    const invoices = [];
    for (let i = 0; i < result.rows.length; i++) {
      invoices.push(result.rows.item(i));
    }

    return {
      data: invoices,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      hasMore: page * limit < total,
    };
  }

  /**
   * Delete an invoice and its line items (cascades via FK)
   */
  async delete(id) {
    await db.executeSql('DELETE FROM invoices WHERE id = ?', [id]);
  }

  /**
   * Update invoice status
   */
  async updateStatus(id, status) {
    await db.executeSql(
      "UPDATE invoices SET status = ?, updated_at = datetime('now') WHERE id = ?",
      [status, id]
    );
  }

  /**
   * Update invoice PDF path
   */
  async updatePdfPath(id, pdfPath) {
    await db.executeSql(
      "UPDATE invoices SET pdf_path = ?, updated_at = datetime('now') WHERE id = ?",
      [pdfPath, id]
    );
  }

  /**
   * Get summary statistics
   */
  async getStats() {
    const result = await db.executeSql(`
      SELECT
        COUNT(*) as total_invoices,
        SUM(CASE WHEN status = 'paid' THEN total ELSE 0 END) as total_paid,
        SUM(CASE WHEN status = 'sent' THEN total ELSE 0 END) as total_pending,
        SUM(CASE WHEN status = 'overdue' THEN total ELSE 0 END) as total_overdue,
        COUNT(CASE WHEN status = 'draft' THEN 1 END) as draft_count,
        COUNT(CASE WHEN status = 'sent' THEN 1 END) as sent_count,
        COUNT(CASE WHEN status = 'paid' THEN 1 END) as paid_count,
        COUNT(CASE WHEN status = 'overdue' THEN 1 END) as overdue_count
      FROM invoices
    `);
    return result.rows.item(0);
  }

  /**
   * Get all invoices for export (backup)
   */
  async getAllForExport() {
    const invoices = await db.executeSql(
      'SELECT * FROM invoices ORDER BY created_at DESC'
    );
    const allInvoices = [];

    for (let i = 0; i < invoices.rows.length; i++) {
      const invoice = { ...invoices.rows.item(i) };
      const items = await db.executeSql(
        'SELECT * FROM line_items WHERE invoice_id = ? ORDER BY sort_order',
        [invoice.id]
      );
      invoice.line_items = [];
      for (let j = 0; j < items.rows.length; j++) {
        invoice.line_items.push(items.rows.item(j));
      }
      allInvoices.push(invoice);
    }

    return allInvoices;
  }
}

export default new InvoiceRepository();
