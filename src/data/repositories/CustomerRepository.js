/**
 * Customer Repository
 * Data access layer for customer management
 */

import db from '../database/DatabaseManager';

class CustomerRepository {
  /**
   * Create a new customer
   */
  async create(customer) {
    const result = await db.executeSql(
      `INSERT INTO customers (
        name, email, phone, address, city, state, zip_code, gstin, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        customer.name,
        customer.email || '',
        customer.phone || '',
        customer.address || '',
        customer.city || '',
        customer.state || '',
        customer.zip_code || '',
        customer.gstin || '',
        customer.notes || '',
      ]
    );
    return result.insertId;
  }

  /**
   * Update an existing customer
   */
  async update(id, customer) {
    await db.executeSql(
      `UPDATE customers SET
        name = ?, email = ?, phone = ?, address = ?,
        city = ?, state = ?, zip_code = ?, gstin = ?, notes = ?,
        updated_at = datetime('now')
      WHERE id = ?`,
      [
        customer.name,
        customer.email || '',
        customer.phone || '',
        customer.address || '',
        customer.city || '',
        customer.state || '',
        customer.zip_code || '',
        customer.gstin || '',
        customer.notes || '',
        id,
      ]
    );
  }

  /**
   * Get customer by ID
   */
  async getById(id) {
    const result = await db.executeSql(
      'SELECT * FROM customers WHERE id = ?',
      [id]
    );
    return result.rows.length > 0 ? result.rows.item(0) : null;
  }

  /**
   * Get all customers with optional search
   */
  async getAll({ search, page = 1, limit = 50 } = {}) {
    let query = 'SELECT * FROM customers WHERE 1=1';
    let countQuery = 'SELECT COUNT(*) as total FROM customers WHERE 1=1';
    const params = [];
    const countParams = [];

    if (search) {
      const clause = ' AND (name LIKE ? OR email LIKE ? OR phone LIKE ?)';
      query += clause;
      countQuery += clause;
      const s = `%${search}%`;
      params.push(s, s, s);
      countParams.push(s, s, s);
    }

    const countResult = await db.executeSql(countQuery, countParams);
    const total = countResult.rows.item(0).total;

    query += ' ORDER BY name ASC LIMIT ? OFFSET ?';
    params.push(limit, (page - 1) * limit);

    const result = await db.executeSql(query, params);
    const customers = [];
    for (let i = 0; i < result.rows.length; i++) {
      customers.push(result.rows.item(i));
    }

    return { data: customers, total };
  }

  /**
   * Delete a customer
   */
  async delete(id) {
    await db.executeSql('DELETE FROM customers WHERE id = ?', [id]);
  }

  /**
   * Get customer invoice count
   */
  async getInvoiceCount(customerId) {
    const result = await db.executeSql(
      'SELECT COUNT(*) as count FROM invoices WHERE customer_id = ?',
      [customerId]
    );
    return result.rows.item(0).count;
  }

  /**
   * Get all customers for export
   */
  async getAllForExport() {
    const result = await db.executeSql(
      'SELECT * FROM customers ORDER BY name ASC'
    );
    const customers = [];
    for (let i = 0; i < result.rows.length; i++) {
      customers.push(result.rows.item(i));
    }
    return customers;
  }
}

export default new CustomerRepository();
