/**
 * Database Manager - Singleton
 * Handles SQLite database initialization, migrations, and connection management
 */

import SQLite from 'react-native-sqlite-storage';
import {
  CREATE_TABLES,
  CREATE_INDEXES,
  INSERT_DEFAULT_SETTINGS,
  SCHEMA_VERSION,
} from './schema';

// Enable promise-based API
SQLite.enablePromise(true);

const DATABASE_NAME = 'invox.db';

class DatabaseManager {
  constructor() {
    this.db = null;
    this.isInitialized = false;
  }

  /**
   * Get or initialize the database connection
   */
  async getDatabase() {
    if (this.db && this.isInitialized) {
      return this.db;
    }
    return this.initialize();
  }

  /**
   * Initialize the database with schema and indexes
   */
  async initialize() {
    try {
      this.db = await SQLite.openDatabase({
        name: DATABASE_NAME,
        location: 'default',
      });

      // Enable WAL mode for better performance
      await this.db.executeSql('PRAGMA journal_mode = WAL;');
      // Enable foreign keys
      await this.db.executeSql('PRAGMA foreign_keys = ON;');

      // Create tables
      for (const sql of CREATE_TABLES) {
        await this.db.executeSql(sql);
      }

      // Create indexes
      for (const sql of CREATE_INDEXES) {
        await this.db.executeSql(sql);
      }

      // Insert default settings
      await this.db.executeSql(INSERT_DEFAULT_SETTINGS);

      // Migrations for existing databases
      const newColumns = [
        "ALTER TABLE settings ADD COLUMN bank_account_name TEXT DEFAULT ''",
        "ALTER TABLE settings ADD COLUMN bank_account_no TEXT DEFAULT ''",
        "ALTER TABLE settings ADD COLUMN bank_ifsc TEXT DEFAULT ''",
        "ALTER TABLE settings ADD COLUMN bank_branch TEXT DEFAULT ''",
        "ALTER TABLE settings ADD COLUMN bank_mobile TEXT DEFAULT ''",
        "ALTER TABLE settings ADD COLUMN upi_id TEXT DEFAULT ''",
        "ALTER TABLE settings ADD COLUMN thanks_note TEXT DEFAULT 'Thank you for your business!'",
        "ALTER TABLE settings ADD COLUMN qr_code_path TEXT DEFAULT ''"
      ];

      for (const colSql of newColumns) {
        try {
          await this.db.executeSql(colSql);
        } catch (e) {
          // Column might already exist, ignore
        }
      }

      // Store schema version
      await this.db.executeSql(
        `CREATE TABLE IF NOT EXISTS schema_version (version INTEGER PRIMARY KEY);`
      );
      await this.db.executeSql(
        `INSERT OR REPLACE INTO schema_version (version) VALUES (?);`,
        [SCHEMA_VERSION]
      );

      this.isInitialized = true;

      return this.db;
    } catch (error) {
      console.error('[DB] Failed to initialize database:', error);
      throw error;
    }
  }

  /**
   * Execute a single SQL query
   */
  async executeSql(sql, params = []) {
    const db = await this.getDatabase();
    try {
      const [result] = await db.executeSql(sql, params);
      return result;
    } catch (error) {
      console.error('[DB] SQL Error:', sql, params, error);
      throw error;
    }
  }

  /**
   * Execute multiple queries in a transaction
   */
  async executeTransaction(queries) {
    const db = await this.getDatabase();
    return new Promise((resolve, reject) => {
      db.transaction(
        (tx) => {
          for (const { sql, params = [] } of queries) {
            tx.executeSql(
              sql,
              params,
              () => {},
              (_, error) => {
                console.error('[DB] Transaction SQL Error:', sql, error);
                return true; // Rollback
              }
            );
          }
        },
        (error) => {
          console.error('[DB] Transaction Error:', error);
          reject(error);
        },
        () => {
          resolve(true);
        }
      );
    });
  }

  /**
   * Convert SQLite result rows to plain array
   */
  static resultToArray(result) {
    const rows = [];
    for (let i = 0; i < result.rows.length; i++) {
      rows.push(result.rows.item(i));
    }
    return rows;
  }

  /**
   * Close the database connection
   */
  async close() {
    if (this.db) {
      await this.db.close();
      this.db = null;
      this.isInitialized = false;

    }
  }

  /**
   * Delete the database (for testing/reset purposes)
   */
  async deleteDatabase() {
    await this.close();
    await SQLite.deleteDatabase({ name: DATABASE_NAME, location: 'default' });

  }
}

// Singleton instance
const databaseManager = new DatabaseManager();
export default databaseManager;
