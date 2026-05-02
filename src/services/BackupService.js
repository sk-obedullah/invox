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
      // Ensure backup directory exists
      const dirExists = await RNFS.exists(this.backupDir);
      if (!dirExists) {
        await RNFS.mkdir(this.backupDir);
      }

      // Collect all data
      const invoices = await InvoiceRepository.getAllForExport();
      const customers = await CustomerRepository.getAllForExport();
      const items = await ItemRepository.getAll(); // Since getAll just returns all items
      const settings = await SettingsRepository.get();

      const backup = {
        version: 1,
        app: 'Invox',
        created_at: dayjs().toISOString(),
        data: {
          settings,
          customers,
          items,
          invoices,
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

      // Validate backup structure
      if (!backup.app || backup.app !== 'Invox' || !backup.data) {
        throw new Error('Invalid backup file');
      }

      const { settings, customers, items, invoices } = backup.data;

      // Restore in transaction-like manner
      // 1. Settings
      if (settings) {
        await SettingsRepository.update(settings);
      }

      // 2. Customers
      if (customers && customers.length > 0) {
        for (const customer of customers) {
          try {
            const { id, created_at, updated_at, ...customerData } = customer;
            await CustomerRepository.create(customerData);
          } catch (e) { /* Skipping duplicate customer */ }
        }
      }

      // 3. Items
      if (items && items.length > 0) {
        for (const item of items) {
          try {
            const { id, created_at, updated_at, ...itemData } = item;
            await ItemRepository.create(itemData);
          } catch (e) { /* Skipping duplicate item */ }
        }
      }

      // 4. Invoices with line items
      if (invoices && invoices.length > 0) {
        for (const invoice of invoices) {
          try {
            const { id, created_at, updated_at, line_items, ...invoiceData } = invoice;
            const cleanItems = (line_items || []).map(
              ({ id: itemId, invoice_id, ...item }) => item
            );
            await InvoiceRepository.create(invoiceData, cleanItems);
          } catch (e) { /* Skipping duplicate invoice */ }
        }
      }

      return {
        customersRestored: customers?.length || 0,
        itemsRestored: items?.length || 0,
        invoicesRestored: invoices?.length || 0,
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
