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
    const invoiceSql = `INSERT INTO invoices (
      invoice_number, customer_id, customer_name, customer_email,
      customer_phone, customer_address, status, issue_date, due_date,
      subtotal, tax_rate, tax_amount, discount, discount_type,
      total, currency, notes, terms
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    
    const invoiceParams = [
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
    ];

    // Use a complex transaction to get the ID and insert items
    const database = await db.getDatabase();
    return new Promise((resolve, reject) => {
      let createdInvoiceId = null;
      database.transaction(
        tx => {
          tx.executeSql(invoiceSql, invoiceParams, (_, result) => {
            createdInvoiceId = result.insertId;
            
            if (lineItems.length > 0) {
            lineItems.forEach((item, index) => {
              const itemId = item.item_id || null;
              // 1. Insert line item
              tx.executeSql(
                `INSERT INTO line_items (
                  invoice_id, item_id, name, description, quantity,
                  unit_price, mrp_price, purchase_price, tax_rate, tax_amount, total, sort_order
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                  createdInvoiceId,
                  itemId || null,
                  item.name,
                  item.description || '',
                  Number(item.quantity) || 1,
                  Number(item.unit_price) || 0,
                  Number(item.mrp_price) || 0,
                  Number(item.purchase_price) || 0,
                  Number(item.tax_rate) || 0,
                  Number(item.tax_amount) || 0,
                  Number(item.amount || item.total) || 0,
                  item.sort_order || index,
                ]
              );

              // 2. If it's a known item and invoice is no longer draft, deduct stock
              if (itemId && (invoice.status === 'paid' || invoice.status === 'sent')) {
                tx.executeSql(
                  'UPDATE items SET stock_quantity = stock_quantity - ? WHERE id = ?',
                  [Number(item.quantity), itemId]
                );
                tx.executeSql(
                  'INSERT INTO inventory_logs (item_id, type, quantity, price, reference_id, notes) VALUES (?, "out", ?, ?, ?, ?)',
                  [itemId, Number(item.quantity), Number(item.unit_price), createdInvoiceId, `Sold via Invoice ${invoice.invoice_number}`]
                );
              }
            });
            }
          }, (_, err) => {
            console.error('[DB] Invoice Insert Error:', err);
            return true; // rollback
          });
        }, 
        (err) => {
          console.error('[DB] Transaction Failed:', err);
          reject(err);
        }, 
        () => {
          resolve(createdInvoiceId);
        }
      );
    });
  }

  /**
   * Update an existing invoice and its line items
   */
  async update(invoiceId, invoice, lineItems = []) {
    const updateSql = `UPDATE invoices SET
      invoice_number = ?, customer_id = ?, customer_name = ?,
      customer_email = ?, customer_phone = ?, customer_address = ?,
      status = ?, issue_date = ?, due_date = ?,
      subtotal = ?, tax_rate = ?, tax_amount = ?,
      discount = ?, discount_type = ?, total = ?,
      currency = ?, notes = ?, terms = ?,
      updated_at = datetime('now')
    WHERE id = ?`;
    
    const updateParams = [
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
    ];

    const database = await db.getDatabase();
    const oldInvoice = await this.getById(invoiceId);
    const wasFinalized = oldInvoice && (oldInvoice.status === 'sent' || oldInvoice.status === 'paid' || oldInvoice.status === 'overdue');
    
    return new Promise((resolve, reject) => {
      database.transaction(tx => {
        // 1. Get old items to restock before clearing (ONLY if they were previously deducted)
        tx.executeSql('SELECT item_id, quantity FROM line_items WHERE invoice_id = ?', [invoiceId], (_, results) => {
          if (wasFinalized) {
            for (let i = 0; i < results.rows.length; i++) {
              const item = results.rows.item(i);
              if (item.item_id) {
                tx.executeSql('UPDATE items SET stock_quantity = stock_quantity + ? WHERE id = ?', [Number(item.quantity), item.item_id]);
              }
            }
          }
          
          // 2. Delete old items
          tx.executeSql('DELETE FROM line_items WHERE invoice_id = ?', [invoiceId]);

          // 3. Update invoice
          tx.executeSql(updateSql, updateParams);

          // 4. Insert new items
          lineItems.forEach((item, index) => {
            const itemId = item.item_id || null;
            tx.executeSql(
              `INSERT INTO line_items (
                invoice_id, item_id, name, description,
                quantity, unit_price, mrp_price, 
                purchase_price, tax_rate, tax_amount, 
                total, sort_order
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                invoiceId, itemId, item.name, item.description || '',
                Number(item.quantity), Number(item.unit_price), Number(item.mrp_price || 0),
                Number(item.purchase_price || 0), Number(item.tax_rate), Number(item.tax_amount),
                Number(item.total || item.amount || 0), index
              ]
            );

            // Deduct stock if new invoice is active
            if (itemId && (invoice.status === 'paid' || invoice.status === 'sent')) {
              tx.executeSql('UPDATE items SET stock_quantity = stock_quantity - ? WHERE id = ?', [Number(item.quantity), itemId]);
              tx.executeSql(
                'INSERT INTO inventory_logs (item_id, type, quantity, price, reference_id, notes) VALUES (?, "out", ?, ?, ?, ?)',
                [itemId, Number(item.quantity), Number(item.unit_price), invoiceId, `Updated via Invoice ${invoice.invoice_number}`]
              );
            }
          });
        });
      }, (err) => {
        console.error('[DB] Update Transaction Failed:', err);
        reject(err);
      }, async () => {
        // Automatically create a revision snapshot if this is an update to a non-draft invoice
        try {
          const updated = await this.getById(invoiceId);
          if (updated && updated.status !== 'draft') {
            await this.createRevision(invoiceId, updated, 'Background update capture');
          }
        } catch (revErr) {
          console.error('[InvoiceRepository] Automated snapshot failed:', revErr);
        }
        resolve(true);
      });
    });
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
    let query = 'SELECT * FROM invoices WHERE is_active = 1';
    let countQuery = 'SELECT COUNT(*) as total FROM invoices WHERE is_active = 1';
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
   * Get all archived invoices
   */
  async getArchived() {
    const results = await db.executeSql(
      'SELECT * FROM invoices WHERE is_active = 0 ORDER BY issue_date DESC'
    );
    const invoices = [];
    for (let i = 0; i < results.rows.length; i++) {
      invoices.push(results.rows.item(i));
    }
    return invoices;
  }

  /**
   * Restore an archived invoice
   */
  async restore(id) {
    await db.executeSql('UPDATE invoices SET is_active = 1 WHERE id = ?', [id]);
    return true;
  }

  /**
   * Delete an invoice and its line items (cascades via FK)
   */
  async delete(id) {
    try {
      // Soft delete: move to archive, keep stock impact for statistics
      await db.executeSql('UPDATE invoices SET is_active = 0 WHERE id = ?', [id]);
      return true;
    } catch (err) {
      console.error('[InvoiceRepository] Error archiving invoice:', err);
      throw err;
    }
  }

  /**
   * Update invoice status
   */
  async updateStatus(id, status) {
    try {
      const currentInvoice = await this.getById(id);
      if (!currentInvoice || currentInvoice.status === status) return;

      // 1. Record the status change in the timeline (before modifying status)
      await this.createRevision(id, currentInvoice, `Status changed to ${status.charAt(0).toUpperCase() + status.slice(1)}`);

      // 2. Handle Stock Reversion if cancelling from a finalized state
      const wasFinalized = currentInvoice.status === 'sent' || currentInvoice.status === 'paid';
      if (status === 'cancelled' && wasFinalized) {
        const results = await this.getLineItemsByInvoiceId(id);
        for (const item of results) {
          if (item.item_id) {
            // Revert stock
            await db.executeSql(
              'UPDATE items SET stock_quantity = stock_quantity + ? WHERE id = ?',
              [Number(item.quantity), item.item_id]
            );
            // Log the return
            await db.executeSql(
              'INSERT INTO inventory_logs (item_id, type, quantity, price, reference_id, notes) VALUES (?, "in", ?, ?, ?, ?)',
              [item.item_id, Number(item.quantity), Number(item.unit_price), id, `Restocked due to Invoice ${currentInvoice.invoice_number} cancellation`]
            );
          }
        }
      }

      // 3. Update the invoice status
      await db.executeSql(
        "UPDATE invoices SET status = ?, updated_at = datetime('now') WHERE id = ?",
        [status, id]
      );
      
      return true;
    } catch (err) {
      console.error('[InvoiceRepository] Status update failed:', err);
      throw err;
    }
  }

  /**
   * Create a permanent revision snapshot
   */
  async createRevision(invoiceId, invoiceData, reason = 'Automatic Snapshot') {
    try {
      const snapshot = JSON.stringify(invoiceData);
      const revisionNum = (invoiceData.revision_number || 0) + 1;
      
      await db.executeSql(
        'INSERT INTO invoice_revisions (invoice_id, revision_number, snapshot_data, reason) VALUES (?, ?, ?, ?)',
        [invoiceId, revisionNum, snapshot, reason]
      );
      
      await db.executeSql(
        'UPDATE invoices SET revision_number = ?, is_revised = 1 WHERE id = ?',
        [revisionNum, invoiceId]
      );
      
      return true;
    } catch (err) {
      console.error('[InvoiceRepository] Error creating revision:', err);
      return false;
    }
  }

  /**
   * Get revision history for an invoice
   */
  async getRevisions(invoiceId) {
    try {
      const results = await db.executeSql(
        'SELECT * FROM invoice_revisions WHERE invoice_id = ? ORDER BY revision_number DESC',
        [invoiceId]
      );
      const revisions = [];
      for (let i = 0; i < results.rows.length; i++) {
        const rev = results.rows.item(i);
        revisions.push({
          ...rev,
          snapshot: JSON.parse(rev.snapshot_data)
        });
      }
      return revisions;
    } catch (err) {
      console.error('[InvoiceRepository] Error fetching revisions:', err);
      return [];
    }
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
   * Get all invoices for export (backup) - Optimized for high speed
   */
  async getAllForExport() {
    const invoicesResult = await db.executeSql('SELECT * FROM invoices ORDER BY created_at DESC');
    const itemsResult = await db.executeSql('SELECT * FROM line_items ORDER BY invoice_id, sort_order');
    
    // Group items by invoice_id in one pass (extremely efficient)
    const itemsMap = {};
    for (let j = 0; j < itemsResult.rows.length; j++) {
      const item = itemsResult.rows.item(j);
      if (!itemsMap[item.invoice_id]) itemsMap[item.invoice_id] = [];
      itemsMap[item.invoice_id].push(item);
    }
    
    const allInvoices = [];
    for (let i = 0; i < invoicesResult.rows.length; i++) {
      const invoice = { ...invoicesResult.rows.item(i) };
      invoice.line_items = itemsMap[invoice.id] || [];
      allInvoices.push(invoice);
    }

    return allInvoices;
  }
  /**
   * Get profit and loss statistics for the dashboard
   */
  async getProfitStats() {
    try {
      // 1. Basic Revenue and Sales Count (Paid & Sent Invoices)
      const revenueResult = await db.executeSql(`
        SELECT 
          SUM(total) as total_revenue,
          SUM(tax_amount) as total_tax_collected,
          COUNT(id) as total_sales_count
        FROM invoices 
        WHERE status IN ('paid', 'sent', 'overdue')
      `);
      const revenueStats = revenueResult.rows.item(0);
      console.log('[DB] Basic Stats:', revenueStats);

      // 2. Monthly Comparison (This Month vs Last Month)
      const thisMonthResult = await db.executeSql(`
        SELECT SUM(total) as amount FROM invoices 
        WHERE status IN ('paid', 'sent', 'overdue') AND issue_date >= date('now', 'start of month')
      `);
      const lastMonthResult = await db.executeSql(`
        SELECT SUM(total) as amount FROM invoices 
        WHERE status IN ('paid', 'sent', 'overdue') 
        AND issue_date >= date('now', 'start of month', '-1 month')
        AND issue_date < date('now', 'start of month')
      `);
      
      const thisMonthRevenue = thisMonthResult.rows.item(0).amount || 0;
      const lastMonthRevenue = lastMonthResult.rows.item(0).amount || 0;
      const monthlyGrowth = lastMonthRevenue > 0 
        ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue * 100).toFixed(1)
        : (thisMonthRevenue > 0 ? 100 : 0);

      // 3. Receivables (Unpaid Money)
      const receivablesResult = await db.executeSql(`
        SELECT 
          SUM(CASE WHEN status = 'sent' THEN total ELSE 0 END) as pending_total,
          SUM(CASE WHEN status = 'overdue' THEN total ELSE 0 END) as overdue_total
        FROM invoices
      `);
      const receivables = receivablesResult.rows.item(0);

      // 4. Investment calculation (Cost of Goods Sold - for all sold items)
      const investmentResult = await db.executeSql(`
        SELECT SUM(li.quantity * li.purchase_price) as total_investment
        FROM line_items li
        JOIN invoices i ON i.id = li.invoice_id
        WHERE i.status IN ('paid', 'sent', 'overdue')
      `);
      const investmentStats = investmentResult.rows.item(0);

      const totalRevenue = revenueStats.total_revenue || 0;
      const totalInvestment = investmentStats.total_investment || 0;
      const netProfit = totalRevenue - totalInvestment;

      // 5. Daily Trend (Last 7 Days)
      const trendResult = await db.executeSql(`
        SELECT issue_date as date, SUM(total) as amount
        FROM invoices
        WHERE status IN ('paid', 'sent', 'overdue') AND issue_date >= date('now', '-7 days')
        GROUP BY issue_date
        ORDER BY issue_date ASC
      `);
      const dailyTrend = [];
      for (let i = 0; i < trendResult.rows.length; i++) {
        dailyTrend.push(trendResult.rows.item(i));
      }

      // 6. Top Items and Customers
      const itemsResult = await db.executeSql(`
        SELECT name, SUM(quantity) as total_qty, SUM(amount) as total_revenue
        FROM line_items li
        JOIN invoices i ON i.id = li.invoice_id
        WHERE i.status IN ('paid', 'sent', 'overdue')
        GROUP BY name
        ORDER BY total_qty DESC
        LIMIT 5
      `);
      const topItems = [];
      for (let i = 0; i < itemsResult.rows.length; i++) {
        topItems.push(itemsResult.rows.item(i));
      }

      const customersResult = await db.executeSql(`
        SELECT customer_name, COUNT(id) as invoice_count, SUM(total) as total_spent
        FROM invoices
        WHERE status IN ('paid', 'sent', 'overdue')
        GROUP BY customer_name
        ORDER BY total_spent DESC
        LIMIT 5
      `);
      const topCustomers = [];
      for (let i = 0; i < customersResult.rows.length; i++) {
        topCustomers.push(customersResult.rows.item(i));
      }

      return {
        totalRevenue,
        totalInvestment,
        netProfit,
        thisMonthRevenue,
        lastMonthRevenue,
        monthlyGrowth,
        pendingAmount: receivables.pending_total || 0,
        overdueAmount: receivables.overdue_total || 0,
        averageInvoiceValue: totalRevenue > 0 ? (totalRevenue / (revenueStats.total_sales_count || 1)).toFixed(0) : 0,
        totalTax: revenueStats.total_tax_collected || 0,
        totalSalesCount: revenueStats.total_sales_count || 0,
        profitMargin: totalRevenue > 0 
          ? ((netProfit / totalRevenue) * 100).toFixed(1) 
          : 0,
        dailyTrend,
        topItems,
        topCustomers
      };
    } catch (err) {
      console.error('[DB] Profit Stats Error:', err);
      throw err;
    }
  }

  /**
   * Get all invoices and their line items for backup/export
   */
  async getAllForExport() {
    try {
      const result = await db.executeSql('SELECT * FROM invoices ORDER BY created_at ASC');
      const invoices = [];
      
      for (let i = 0; i < result.rows.length; i++) {
        const invoice = { ...result.rows.item(i) };
        const itemsResult = await db.executeSql(
          'SELECT * FROM line_items WHERE invoice_id = ? ORDER BY sort_order ASC',
          [invoice.id]
        );
        invoice.line_items = [];
        for (let j = 0; j < itemsResult.rows.length; j++) {
          invoice.line_items.push(itemsResult.rows.item(j));
        }
        invoices.push(invoice);
      }
      return invoices;
    } catch (err) {
      console.error('[InvoiceRepository] Error fetching all for export:', err);
      throw err;
    }
  }
}

export default new InvoiceRepository();
