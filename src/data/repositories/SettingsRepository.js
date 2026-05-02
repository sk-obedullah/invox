/**
 * Settings Repository
 * Data access layer for app settings (single row)
 */

import db from '../database/DatabaseManager';

class SettingsRepository {
  /**
   * Get current settings
   */
  async get() {
    const result = await db.executeSql('SELECT * FROM settings WHERE id = 1');
    if (result.rows.length > 0) {
      const item = result.rows.item(0);
      return {
        ...item,
        is_activated: !!item.is_activated, // Convert 0/1 to boolean
      };
    }
    return null;
  }

  /**
   * Update settings
   */
  async update(settings) {
    await db.executeSql(
      `UPDATE settings SET
        company_name = ?,
        company_address = ?,
        company_phone = ?,
        company_email = ?,
        company_logo_path = ?,
        default_currency = ?,
        default_tax_rate = ?,
        invoice_prefix = ?,
        next_invoice_number = ?,
        default_notes = ?,
        default_terms = ?,
        template = ?,
        theme = ?,
        bank_account_name = ?,
        bank_account_no = ?,
        bank_ifsc = ?,
        bank_branch = ?,
        bank_mobile = ?,
        upi_id = ?,
        thanks_note = ?,
        qr_code_path = ?,
        is_activated = ?,
        updated_at = datetime('now')
      WHERE id = 1`,
      [
        settings.company_name || '',
        settings.company_address || '',
        settings.company_phone || '',
        settings.company_email || '',
        settings.company_logo_path || '',
        settings.default_currency || 'INR',
        settings.default_tax_rate ?? 18.0,
        settings.invoice_prefix || 'INV',
        settings.next_invoice_number ?? 1001,
        settings.default_notes || '',
        settings.default_terms || 'Payment is due within 30 days of invoice date.',
        settings.template || 'modern',
        settings.theme || 'system',
        settings.bank_account_name || '',
        settings.bank_account_no || '',
        settings.bank_ifsc || '',
        settings.bank_branch || '',
        settings.bank_mobile || '',
        settings.upi_id || '',
        settings.thanks_note || 'Thank you for your business!',
        settings.qr_code_path || '',
        settings.is_activated ? 1 : 0,
      ]
    );
  }

  /**
   * Get and increment the next invoice number
   */
  async getNextInvoiceNumber() {
    const settings = await this.get();
    const prefix = settings.invoice_prefix || 'INV';
    const number = settings.next_invoice_number || 1001;
    const invoiceNumber = `${prefix}-${String(number).padStart(4, '0')}`;

    // Increment for next use
    await db.executeSql(
      "UPDATE settings SET next_invoice_number = next_invoice_number + 1, updated_at = datetime('now') WHERE id = 1"
    );

    return invoiceNumber;
  }

  /**
   * Update company logo path
   */
  async updateLogoPath(path) {
    await db.executeSql(
      "UPDATE settings SET company_logo_path = ?, updated_at = datetime('now') WHERE id = 1",
      [path]
    );
  }

  /**
   * Update theme preference
   */
  async updateTheme(theme) {
    await db.executeSql(
      "UPDATE settings SET theme = ?, updated_at = datetime('now') WHERE id = 1",
      [theme]
    );
  }
}

export default new SettingsRepository();
