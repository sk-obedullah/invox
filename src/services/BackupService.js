/**
 * Backup & Restore Service
 * Export/Import all data as JSON for offline backup
 */

import RNFS from 'react-native-fs';
import dayjs from 'dayjs';
import InvoiceRepository from '../data/repositories/InvoiceRepository';
import CustomerRepository from '../data/repositories/CustomerRepository';
import ItemRepository from '../data/repositories/ItemRepository';
import SettingsRepository from '../data/repositories/SettingsRepository';
import databaseManager from '../data/database/DatabaseManager';

class BackupService {
  constructor() {
    this.backupDir = `${RNFS.CachesDirectoryPath}/backups`;
  }

  /**
   * Create a full data backup as JSON
   */
  async createBackup() {
    try {
      const dirExists = await RNFS.exists(this.backupDir);
      if (!dirExists) {
        await RNFS.mkdir(this.backupDir);
      }

      const db = await databaseManager.getDatabase();
      const getTable = async (table) => {
        const [res] = await db.executeSql(`SELECT * FROM ${table}`);
        const data = [];
        for (let i = 0; i < res.rows.length; i++) data.push(res.rows.item(i));
        return data;
      };

      // Raw backup of all tables to preserve strict IDs and relations
      const backup = {
        version: 2,
        app: 'Invox',
        created_at: dayjs().toISOString(),
        data: {
          settings: await getTable('settings'),
          customers: await getTable('customers'),
          items: await getTable('items'),
          invoices: await getTable('invoices'),
          line_items: await getTable('line_items'),
          inventory_logs: await getTable('inventory_logs'),
          invoice_revisions: await getTable('invoice_revisions'),
        },
      };

      const fileName = `invox_backup_${dayjs().format('YYYY-MM-DD_HH-mm')}.json`;
      const filePath = `${this.backupDir}/${fileName}`;
      await RNFS.writeFile(filePath, JSON.stringify(backup, null, 2), 'utf8');

      return filePath;
    } catch (error) {
      console.error('[BackupService] Backup failed:', error);
      throw new Error('Failed to create backup');
    }
  }

  /**
   * Restore data from a JSON backup file
   */
  async restoreFromFile(filePath) {
    try {
      const content = await RNFS.readFile(filePath, 'utf8');
      const backup = JSON.parse(content);

      if (!backup.app || backup.app !== 'Invox' || !backup.data) {
        throw new Error('Invalid backup file');
      }

      const db = await databaseManager.getDatabase();

      // Step 1: Wipe current user data (except schema/activation if needed, but for full restore we wipe and re-insert)
      const tablesToClear = ['invoice_revisions', 'inventory_logs', 'line_items', 'invoices', 'items', 'customers'];
      for (const table of tablesToClear) {
        await db.executeSql(`DELETE FROM ${table}`);
      }

      const insertData = async (tableName, rows) => {
        if (!rows || rows.length === 0) return;
        const columns = Object.keys(rows[0]);
        const placeholders = columns.map(() => '?').join(', ');
        const sql = `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders})`;
        
        for (const row of rows) {
          const values = columns.map(col => row[col]);
          await db.executeSql(sql, values);
        }
      };

      // Handle V1 (Legacy) and V2 (Raw) backups
      if (backup.version === 1 || !backup.data.line_items) {
        // Legacy restore
        const { customers, items, invoices } = backup.data;
        await insertData('customers', customers);
        await insertData('items', items);
        
        if (invoices) {
          const legacyInvoices = invoices.map(({ line_items, ...inv }) => inv);
          await insertData('invoices', legacyInvoices);
          
          let lineItemsToInsert = [];
          invoices.forEach(inv => {
            if (inv.line_items) lineItemsToInsert.push(...inv.line_items);
          });
          await insertData('line_items', lineItemsToInsert);
        }
      } else {
        // V2 Restore (Raw Tables)
        await insertData('customers', backup.data.customers);
        await insertData('items', backup.data.items);
        await insertData('invoices', backup.data.invoices);
        await insertData('line_items', backup.data.line_items);
        await insertData('inventory_logs', backup.data.inventory_logs);
        await insertData('invoice_revisions', backup.data.invoice_revisions);
      }

      // Handle settings (Preserve activation status)
      const currentSettings = await SettingsRepository.get();
      if (backup.data.settings && backup.data.settings.length > 0) {
        const importedSettings = Array.isArray(backup.data.settings) ? backup.data.settings[0] : backup.data.settings;
        await db.executeSql(`DELETE FROM settings`);
        const { is_activated, ...rest } = importedSettings; // Extract imported activation
        
        // Ensure the device retains its actual hardware activation state
        const finalActivated = currentSettings ? currentSettings.is_activated : 0;
        
        const settingsToInsert = { ...importedSettings, is_activated: finalActivated };
        await insertData('settings', [settingsToInsert]);
      }

      return {
        customersRestored: backup.data.customers?.length || 0,
        itemsRestored: backup.data.items?.length || 0,
        invoicesRestored: backup.data.invoices?.length || 0,
      };
    } catch (error) {
      console.error('[BackupService] Restore failed:', error);
      throw error;
    }
  }

  /**
   * List available backups
   */
  async listBackups() {
    try {
      const dirExists = await RNFS.exists(this.backupDir);
      if (!dirExists) return [];

      const files = await RNFS.readDir(this.backupDir);
      return files
        .filter((f) => f.name.endsWith('.json'))
        .sort((a, b) => b.mtime - a.mtime)
        .map((f) => ({
          name: f.name,
          path: f.path,
          size: f.size,
          date: f.mtime,
        }));
    } catch {
      return [];
    }
  }

  /**
   * Delete a backup file
   */
  async deleteBackup(filePath) {
    try {
      await RNFS.unlink(filePath);
    } catch (error) {
      console.error('[BackupService] Delete backup failed:', error);
    }
  }
}

export default new BackupService();
