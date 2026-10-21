import databaseManager from '../database/DatabaseManager';

class ItemRepository {
  /**
   * Get all items, ordered by name
   */
  async getAll() {
    const result = await databaseManager.executeSql(
      'SELECT * FROM items WHERE is_active = 1 ORDER BY name ASC'
    );
    return databaseManager.constructor.resultToArray(result);
  }

  /**
   * Search items by name or description
   */
  async search(query, limit = 20) {
    const sql = `
      SELECT * FROM items 
      WHERE is_active = 1 AND (name LIKE ? OR description LIKE ?) 
      ORDER BY name ASC 
      LIMIT ?
    `;
    const result = await databaseManager.executeSql(sql, [`%${query}%`, `%${query}%`, limit]);
    return databaseManager.constructor.resultToArray(result);
  }

  /**
   * Get recently used items based on previous invoices
   */
  async getRecentlyUsed(limit = 5) {
    const sql = `
      SELECT i.* FROM items i
      JOIN (
        SELECT name, MAX(id) as last_id 
        FROM line_items 
        GROUP BY name 
        ORDER BY last_id DESC 
        LIMIT ?
      ) li ON i.name = li.name
      WHERE i.is_active = 1
    `;
    const result = await databaseManager.executeSql(sql, [limit]);
    return databaseManager.constructor.resultToArray(result);
  }

  /**
   * Get item by ID
   */
  async getById(id) {
    const result = await databaseManager.executeSql(
      'SELECT * FROM items WHERE id = ?',
      [id]
    );
    const rows = databaseManager.constructor.resultToArray(result);
    return rows.length > 0 ? rows[0] : null;
  }

  /**
   * Create a new item with initial stock
   */
  async create(item) {
    const {
      name,
      description = '',
      unit_price = 0,
      mrp_price = 0,
      purchase_price = 0,
      tax_rate = 0,
      stock_quantity = 0,
      min_stock_level = 0,
    } = item;

    const result = await databaseManager.executeSql(
      `INSERT INTO items (
        name, description, unit_price, mrp_price, purchase_price, tax_rate, 
        stock_quantity, min_stock_level, is_active, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, datetime('now'), datetime('now'))`,
      [name, description, unit_price, mrp_price, purchase_price, tax_rate, stock_quantity, min_stock_level]
    );

    const createdItemId = result.insertId;

    // Log initial stock as a batch
    if (stock_quantity > 0) {
      await databaseManager.executeSql(
        `INSERT INTO inventory_logs (item_id, type, quantity, price, notes) 
         VALUES (?, 'in', ?, ?, 'Initial Stock')`,
        [createdItemId, stock_quantity, purchase_price]
      );
    }

    return createdItemId;
  }

  /**
   * Update an existing item
   */
  async update(id, item) {
    const {
      name,
      description,
      unit_price,
      mrp_price,
      purchase_price,
      tax_rate,
      stock_quantity,
      min_stock_level,
    } = item;

    await databaseManager.executeSql(
      `UPDATE items SET 
        name = ?, 
        description = ?, 
        unit_price = ?, 
        mrp_price = ?,
        purchase_price = ?,
        tax_rate = ?, 
        stock_quantity = ?,
        min_stock_level = ?,
        updated_at = datetime('now')
      WHERE id = ?`,
      [name, description, unit_price, mrp_price, purchase_price, tax_rate, stock_quantity, min_stock_level, id]
    );

    return true;
  }

  /**
   * Add stock to an item (Stock In / Batch)
   */
  async stockUp(id, quantity, purchasePrice, batchNumber = '', notes = '') {
    const database = await databaseManager.getDatabase();
    return new Promise((resolve, reject) => {
      database.transaction(tx => {
        // 1. Update quantity in items table
        tx.executeSql(
          'UPDATE items SET stock_quantity = stock_quantity + ?, purchase_price = ?, updated_at = datetime("now") WHERE id = ?',
          [quantity, purchasePrice, id]
        );
        
        // 2. Create inventory log (Batch)
        tx.executeSql(
          'INSERT INTO inventory_logs (item_id, type, quantity, price, batch_number, notes) VALUES (?, "in", ?, ?, ?, ?)',
          [id, 'in', quantity, purchasePrice, batchNumber, notes]
        );
      }, (err) => reject(err), () => resolve(true));
    });
  }

  /**
   * Adjust stock (Manual correction)
   */
  async adjustStock(id, newQuantity, notes = '') {
    const item = await this.getById(id);
    if (!item) return false;

    const diff = newQuantity - item.stock_quantity;
    
    await databaseManager.executeSql(
      'UPDATE items SET stock_quantity = ?, updated_at = datetime("now") WHERE id = ?',
      [newQuantity, id]
    );

    await databaseManager.executeSql(
      'INSERT INTO inventory_logs (item_id, type, quantity, notes) VALUES (?, "adjustment", ?, ?)',
      [id, diff > 0 ? 'in' : 'out', Math.abs(diff), notes]
    );

    return true;
  }

  /**
   * Get comprehensive inventory & investment report
   */
  async getInventoryReport() {
    // 1. Current Inventory Value (What's on the shelf)
    const currentValuation = await databaseManager.executeSql(`
      SELECT 
        SUM(stock_quantity) as total_items_left,
        SUM(stock_quantity * purchase_price) as current_investment_value,
        SUM(stock_quantity * unit_price) as potential_revenue
      FROM items
      WHERE is_active = 1
    `);

    // 2. Total Business Investment (All time "Stock In" costs)
    const totalInvestment = await databaseManager.executeSql(`
      SELECT SUM(quantity * price) as all_time_investment
      FROM inventory_logs
      WHERE type = 'in'
    `);

    // 3. Sales Performance
    const salesPerformance = await databaseManager.executeSql(`
      SELECT 
        SUM(quantity) as total_items_sold,
        SUM(quantity * price) as total_revenue,
        SUM(quantity * (price - (SELECT purchase_price FROM items WHERE items.id = inventory_logs.item_id))) as estimated_profit
      FROM inventory_logs
      WHERE type = 'out'
    `);

    return {
      stock: currentValuation.rows.item(0),
      allTimeInvestment: totalInvestment.rows.item(0).all_time_investment || 0,
      sales: salesPerformance.rows.item(0)
    };
  }

  /**
   * Delete an item
   */
  async delete(id) {
    await databaseManager.executeSql(
      'UPDATE items SET is_active = 0 WHERE id = ?',
      [id]
    );
    return true;
  }

  /**
   * Get all archived items
   */
  async getArchived() {
    const result = await databaseManager.executeSql(
      'SELECT * FROM items WHERE is_active = 0 ORDER BY name ASC'
    );
    return databaseManager.constructor.resultToArray(result);
  }

  /**
   * Restore an archived item
   */
  async restore(id) {
    await databaseManager.executeSql(
      'UPDATE items SET is_active = 1 WHERE id = ?',
      [id]
    );
    return true;
  }
}

export default new ItemRepository();
