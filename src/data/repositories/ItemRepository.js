import databaseManager from '../database/DatabaseManager';

class ItemRepository {
  /**
   * Get all items, ordered by name
   */
  async getAll() {
    const result = await databaseManager.executeSql(
      'SELECT * FROM items ORDER BY name ASC'
    );
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
   * Create a new item
   */
  async create(item) {
    const {
      name,
      description = '',
      unit_price = 0,
      tax_rate = 0,
    } = item;

    const result = await databaseManager.executeSql(
      `INSERT INTO items (
        name, description, unit_price, tax_rate, created_at, updated_at
      ) VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))`,
      [name, description, unit_price, tax_rate]
    );

    return result.insertId;
  }

  /**
   * Update an existing item
   */
  async update(id, item) {
    const {
      name,
      description,
      unit_price,
      tax_rate,
    } = item;

    await databaseManager.executeSql(
      `UPDATE items SET 
        name = ?, 
        description = ?, 
        unit_price = ?, 
        tax_rate = ?, 
        updated_at = datetime('now')
      WHERE id = ?`,
      [name, description, unit_price, tax_rate, id]
    );

    return true;
  }

  /**
   * Delete an item
   */
  async delete(id) {
    await databaseManager.executeSql(
      'DELETE FROM items WHERE id = ?',
      [id]
    );
    return true;
  }
}

export default new ItemRepository();
