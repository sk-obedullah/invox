/**
 * PDF Generation Service
 * Generates professional invoice PDFs using HTML templates
 */

import { Platform } from 'react-native';
import { generatePDF } from 'react-native-html-to-pdf';
import RNFS from 'react-native-fs';
import { formatCurrency, formatDate } from '../utils/formatters';
import { TEMPLATE_IDS } from '../constants/templates';
import SettingsRepository from '../data/repositories/SettingsRepository';

class PdfService {
  /**
   * Generate an invoice PDF
   */
  async generateInvoicePdf(invoice, settings, templateId = TEMPLATE_IDS.MODERN) {
    try {
      // Auto-resolve settings from DB if empty or missing company_name
      let resolvedSettings = settings;
      if (!resolvedSettings || !resolvedSettings.company_name) {
        try {
          const dbSettings = await SettingsRepository.get();
          if (dbSettings) {
            resolvedSettings = { ...dbSettings, ...(settings || {}) };
          }
        } catch (err) {
          console.warn('[PdfService] Error resolving settings from DB:', err);
        }
      }

      const html = await this.buildHtml(invoice, resolvedSettings || {}, templateId);

      const options = {
        html,
        fileName: `invoice_${invoice.invoice_number}`,
        base64: false,
        width: 595, // A4 width in points
        height: 842, // A4 height in points
      };

      const pdf = await generatePDF(options);
      return pdf.filePath;
    } catch (error) {
      console.error('[PdfService] Generation failed:', error);
      throw new Error(error.message || 'Failed to generate PDF');
    }
  }

  async getImageBase64(path) {
    if (!path) return '';
    try {
      const cleanPath = Platform.OS === 'android' ? path.replace('file://', '') : path;
      const base64 = await RNFS.readFile(cleanPath, 'base64');
      const ext = path.split('.').pop().toLowerCase();
      const mimeType = ext === 'png' ? 'image/png' : (ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : 'image/png');
      return `data:${mimeType};base64,${base64}`;
    } catch (e) {
      console.error('[PdfService] Failed to read image to base64:', e, path);
      return path;
    }
  }

  /**
   * Build HTML content based on template
   */
  async buildHtml(invoice, settings, templateId) {
    const logoSrc = await this.getImageBase64(settings.company_logo_path);
    const customQrSrc = await this.getImageBase64(settings.qr_code_path);
    const upiQrSrc = settings.upi_id 
      ? `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=upi://pay?pa=${encodeURIComponent(settings.upi_id)}%26pn=${encodeURIComponent(settings.bank_account_name || settings.company_name || 'Payment')}`
      : null;
    
    const finalQrSrc = customQrSrc || upiQrSrc;

    const statusColors = this.getStatusColor(invoice.status || 'draft');

    const lineItemsHtml = (invoice.line_items || [])
      .map(
        (item) => `
      <tr>
        <td class="item-cell">
          <div class="item-name">${item.name}</div>
          ${item.description ? `<div class="item-desc">${item.description}</div>` : ''}
        </td>
        <td class="center">${formatCurrency(item.unit_price, invoice.currency)}</td>
        <td class="center">${item.quantity}</td>
        ${settings.enable_tax ? `<td class="center">${item.tax_rate}%</td>` : ''}
        <td class="right item-total">${formatCurrency(item.total || item.amount, invoice.currency)}</td>
      </tr>
    `
      )
      .join('');

    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Montserrat', sans-serif; font-size: 14px; color: #2d3748; line-height: 1.5; background: #fff; }
        .page { width: 100%; min-height: 100vh; position: relative; padding: 40px 50px 70px; background: #fff; }

        /* Top Header Section with Company Branding & Invoice Tag */
        .header-section { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 25px; border-bottom: 2px solid #e2e8f0; margin-bottom: 25px; }
        .company-brand { display: flex; align-items: center; gap: 18px; max-width: 60%; }
        .company-logo { max-height: 75px; max-width: 140px; object-fit: contain; }
        .company-details { display: flex; flex-direction: column; }
        .company-name { font-size: 24px; font-weight: 700; color: #1e3a5f; letter-spacing: 0.5px; margin-bottom: 4px; }
        .company-address { font-size: 12px; color: #4a5568; line-height: 1.4; margin-bottom: 4px; }
        .company-contact { font-size: 11px; color: #718096; font-weight: 500; }
        
        .invoice-title-block { text-align: right; }
        .invoice-main-title { font-size: 32px; font-weight: 700; color: #10b3d6; letter-spacing: 2px; line-height: 1; margin-bottom: 8px; }
        .invoice-tag { font-size: 15px; font-weight: 700; color: #1e3a5f; letter-spacing: 0.5px; margin-bottom: 6px; }
        .status-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; background: ${statusColors.bg}; color: ${statusColors.text}; }

        /* 2-Column Info Grid */
        .info-grid { display: flex; justify-content: space-between; gap: 30px; margin-bottom: 30px; }
        .info-card { flex: 1; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px 20px; }
        .info-card-header { font-size: 11px; font-weight: 700; color: #64748b; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 8px; padding-bottom: 6px; border-bottom: 1px solid #e2e8f0; }
        .customer-name { font-size: 15px; font-weight: 700; color: #1e293b; margin-bottom: 4px; }
        .info-card-body { font-size: 12px; color: #475569; line-height: 1.5; }
        .info-card-body p { margin-bottom: 2px; }

        .meta-row { display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 6px; }
        .meta-row:last-child { margin-bottom: 0; }
        .meta-label { color: #64748b; font-weight: 500; }
        .meta-value { color: #1e293b; font-weight: 600; text-align: right; }

        /* Line Items Table */
        table { width: 100%; border-collapse: collapse; margin-bottom: 25px; }
        thead { background-color: #1e3a5f; color: #fff; }
        th { padding: 10px 14px; text-align: left; font-size: 11px; font-weight: 700; letter-spacing: 0.8px; text-transform: uppercase; color: #ffffff; }
        th:first-child { border-top-left-radius: 8px; width: ${settings.enable_tax ? '42%' : '48%'}; }
        th:last-child { border-top-right-radius: 8px; }
        th.center { text-align: center; }
        th.right { text-align: right; }

        td { padding: 12px 14px; color: #334155; font-size: 13px; border-bottom: 1px solid #e2e8f0; vertical-align: top; }
        td.center { text-align: center; }
        td.right { text-align: right; }
        .item-cell { line-height: 1.3; }
        .item-name { font-weight: 600; color: #0f172a; font-size: 13px; }
        .item-desc { font-size: 11px; color: #64748b; margin-top: 3px; }
        .item-total { font-weight: 600; color: #0f172a; }
        tbody tr:nth-child(even) { background-color: #f8fafc; }

        /* Totals & Remarks */
        .summary-section { display: flex; justify-content: space-between; gap: 30px; margin-bottom: 25px; }
        .remarks-block { flex: 1.1; background: #fff; border: 1px dashed #cbd5e1; border-radius: 8px; padding: 16px 20px; }
        .remarks-title { font-size: 11px; font-weight: 700; color: #475569; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 6px; }
        .remarks-text { font-size: 12px; color: #64748b; line-height: 1.5; white-space: pre-line; }

        .totals-block { flex: 0.9; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px 20px; }
        .total-row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 13px; color: #64748b; }
        .total-row span:last-child { color: #1e293b; font-weight: 600; }
        .total-divider { height: 1px; background: #cbd5e1; margin: 10px 0; }
        .total-row.grand-total { font-size: 18px; font-weight: 700; color: #1e3a5f; margin-bottom: 0; }
        .total-row.grand-total span:last-child { color: #10b3d6; font-size: 20px; }

        /* Footer */
        .doc-footer { position: absolute; bottom: 25px; left: 50px; right: 50px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 12px; }
      </style>
    </head>
    <body>
      <div class="page">
        <!-- Header with Seller Details ("Our Data") -->
        <div class="header-section">
          <div class="company-brand">
            ${logoSrc ? `<img src="${logoSrc}" class="company-logo" />` : ''}
            <div class="company-details">
              <h1 class="company-name">${settings.company_name || 'INVOX'}</h1>
              ${settings.company_address ? `<p class="company-address">${settings.company_address.replace(/\n/g, '<br/>')}</p>` : ''}
              <p class="company-contact">
                ${settings.company_phone ? `<span>Phone: ${settings.company_phone}</span>` : ''}
                ${settings.company_phone && settings.company_email ? ' &bull; ' : ''}
                ${settings.company_email ? `<span>Email: ${settings.company_email}</span>` : ''}
              </p>
            </div>
          </div>

          <div class="invoice-title-block">
            <div class="invoice-main-title">INVOICE</div>
            <div class="invoice-tag">#${invoice.invoice_number}</div>
          </div>
        </div>

        <!-- 2-Column Info Grid: Billed To (Customer) & Invoice Details -->
        <div class="info-grid">
          <div class="info-card">
            <div class="info-card-header">Billed To (Client)</div>
            <div class="info-card-body">
              <div class="customer-name">${invoice.customer_name || 'Valued Customer'}</div>
              ${invoice.customer_address ? `<p>${invoice.customer_address.replace(/\n/g, '<br/>')}</p>` : ''}
              ${invoice.customer_phone ? `<p>Phone: ${invoice.customer_phone}</p>` : ''}
              ${invoice.customer_email ? `<p>Email: ${invoice.customer_email}</p>` : ''}
            </div>
          </div>

          <div class="info-card">
            <div class="info-card-header">Invoice Information</div>
            <div class="info-card-body">
              <div class="meta-row">
                <span class="meta-label">Invoice Number:</span>
                <span class="meta-value">${invoice.invoice_number}</span>
              </div>
              <div class="meta-row">
                <span class="meta-label">Issue Date:</span>
                <span class="meta-value">${formatDate(invoice.issue_date, 'DD MMM YYYY')}</span>
              </div>
              <div class="meta-row">
                <span class="meta-label">Due Date:</span>
                <span class="meta-value">${invoice.due_date ? formatDate(invoice.due_date, 'DD MMM YYYY') : 'Due on receipt'}</span>
              </div>
              <div class="meta-row">
                <span class="meta-label">Billed By:</span>
                <span class="meta-value">${settings.company_name || 'Company'}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Line Items Table -->
        <table>
          <thead>
            <tr>
              <th>ITEMS</th>
              <th class="center">PRICE</th>
              <th class="center">QTY</th>
              ${settings.enable_tax ? `<th class="center">TAX</th>` : ''}
              <th class="right">AMOUNT</th>
            </tr>
          </thead>
          <tbody>
            ${lineItemsHtml}
          </tbody>
        </table>

        <!-- Summary & Totals -->
        <div class="summary-section">
          <div class="remarks-block">
            <div class="remarks-title">Terms & Notes</div>
            <div class="remarks-text">${invoice.terms || invoice.notes || settings.default_terms || 'Thank you for your business!'}</div>
          </div>

          <div class="totals-block">
            <div class="total-row">
              <span>Subtotal:</span>
              <span>${formatCurrency(invoice.subtotal, invoice.currency)}</span>
            </div>
            ${invoice.tax_amount > 0 ? `
            <div class="total-row">
              <span>Tax (${invoice.tax_rate}%):</span>
              <span>${formatCurrency(invoice.tax_amount, invoice.currency)}</span>
            </div>` : ''}
            ${invoice.discount > 0 ? `
            <div class="total-row">
              <span>Discount:</span>
              <span>- ${formatCurrency(invoice.discount, invoice.currency)}</span>
            </div>` : ''}
            <div class="total-divider"></div>
            <div class="total-row grand-total">
              <span>TOTAL:</span>
              <span>${formatCurrency(invoice.total, invoice.currency)}</span>
            </div>
          </div>
        </div>

        <!-- Document Footer -->
        <div class="doc-footer">
          This is a computer-generated invoice from ${settings.company_name || 'Invox'}. Page 1 of ${ (settings.bank_account_no || settings.upi_id || customQrSrc || settings.thanks_note) ? '2' : '1' }
        </div>
      </div>

      <!-- Page 2: Payment Instructions & QR (Only if payment info configured) -->
      ${(settings.bank_account_no || settings.upi_id || customQrSrc || settings.thanks_note) ? `
      <div class="page" style="page-break-before: always; padding: 50px 60px;">
        <div style="text-align: center; margin-bottom: 40px;">
          <h2 style="color: #1e3a5f; font-size: 24px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase;">Payment Instructions</h2>
          <div style="width: 50px; height: 3px; background: #10b3d6; margin: 12px auto;"></div>
          <p style="color: #64748b; font-size: 13px;">Please use the following payment details to settle Invoice <strong>#${invoice.invoice_number}</strong></p>
        </div>
        
        <div style="display: flex; gap: 30px; align-items: flex-start; margin-bottom: 40px;">
          <!-- Bank Details Card -->
          <div style="flex: 1.2; background: #ffffff; border: 1px solid #e1e8f0; border-radius: 12px; padding: 25px; box-shadow: 0 4px 10px rgba(0,0,0,0.02);">
            <div style="display: flex; align-items: center; margin-bottom: 20px;">
              <div style="width: 8px; height: 8px; background: #10b3d6; border-radius: 50%; margin-right: 10px;"></div>
              <h3 style="font-size: 14px; font-weight: 700; color: #1e3a5f; text-transform: uppercase; letter-spacing: 0.8px;">Bank Account Details</h3>
            </div>
            
            <div style="display: grid; gap: 14px;">
              ${settings.bank_account_name ? `
                <div style="display: flex; border-bottom: 1px solid #f0f4f8; padding-bottom: 10px;">
                  <span style="width: 120px; color: #718096; font-size: 12px; font-weight: 600; text-transform: uppercase;">Beneficiary</span>
                  <span style="color: #2d3748; font-size: 14px; font-weight: 600;">${settings.bank_account_name}</span>
                </div>` : ''}
              ${settings.bank_account_no ? `
                <div style="display: flex; border-bottom: 1px solid #f0f4f8; padding-bottom: 10px;">
                  <span style="width: 120px; color: #718096; font-size: 12px; font-weight: 600; text-transform: uppercase;">Account No</span>
                  <span style="color: #2d3748; font-size: 15px; font-weight: 700; letter-spacing: 0.5px;">${settings.bank_account_no}</span>
                </div>` : ''}
              ${settings.bank_ifsc ? `
                <div style="display: flex; border-bottom: 1px solid #f0f4f8; padding-bottom: 10px;">
                  <span style="width: 120px; color: #718096; font-size: 12px; font-weight: 600; text-transform: uppercase;">IFSC Code</span>
                  <span style="color: #2d3748; font-size: 14px; font-weight: 600; font-family: monospace;">${settings.bank_ifsc}</span>
                </div>` : ''}
              ${settings.bank_branch ? `
                <div style="display: flex; border-bottom: 1px solid #f0f4f8; padding-bottom: 10px;">
                  <span style="width: 120px; color: #718096; font-size: 12px; font-weight: 600; text-transform: uppercase;">Branch</span>
                  <span style="color: #2d3748; font-size: 13px; font-weight: 500;">${settings.bank_branch}</span>
                </div>` : ''}
              ${settings.bank_mobile ? `
                <div style="display: flex;">
                  <span style="width: 120px; color: #718096; font-size: 12px; font-weight: 600; text-transform: uppercase;">Contact</span>
                  <span style="color: #2d3748; font-size: 13px; font-weight: 500;">${settings.bank_mobile}</span>
                </div>` : ''}
            </div>
          </div>
          
          <!-- QR Code Card -->
          <div style="flex: 0.8; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 25px; text-align: center;">
            <div style="margin-bottom: 15px;">
              <h3 style="font-size: 13px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.8px;">Quick Pay</h3>
            </div>
            
            ${finalQrSrc ? `
              <div style="background: #fff; padding: 12px; display: inline-block; border-radius: 10px; border: 1px solid #e2e8f0; margin-bottom: 15px;">
                <img src="${finalQrSrc}" style="width: 140px; height: 140px; display: block;" />
              </div>
              <p style="color: #64748b; font-size: 11px; margin-bottom: 10px; font-weight: 500;">Scan using any UPI or Payment app</p>
            ` : ''}
            
            ${settings.upi_id ? `
              <div style="padding: 8px 12px; background: #fff; border-radius: 8px; border: 1px solid #e2e8f0;">
                <span style="display: block; font-size: 10px; color: #94a3b8; font-weight: 600; text-transform: uppercase; margin-bottom: 2px;">UPI ID</span>
                <span style="display: block; font-size: 13px; font-weight: 700; color: #1e293b; word-break: break-all;">${settings.upi_id}</span>
              </div>
            ` : ''}
          </div>
        </div>
        
        <div style="text-align: center; margin-top: 30px; padding: 30px; border-top: 2px dashed #e2e8f0;">
          <h2 style="font-size: 26px; font-weight: 700; color: #1e3a5f; margin-bottom: 10px; font-style: italic;">${settings.thanks_note || 'Thank you for your business!'}</h2>
          <p style="color: #64748b; font-size: 13px; max-width: 500px; margin: 0 auto; line-height: 1.6;">We appreciate your partnership. For questions regarding this invoice, reach us at ${settings.company_email || settings.company_phone || 'our official billing desk'}.</p>
        </div>

        <div class="doc-footer">
          Payment Instructions &bull; ${settings.company_name || 'Invox'} &bull; Page 2 of 2
        </div>
      </div>
      ` : ''}
      
    </body>
    </html>
    `;
  }

  getStatusColor(status) {
    const map = {
      draft: { bg: '#F1F5F9', text: '#475569' },
      sent: { bg: '#EFF6FF', text: '#2563EB' },
      paid: { bg: '#ECFDF5', text: '#059669' },
      overdue: { bg: '#FEF2F2', text: '#DC2626' },
      cancelled: { bg: '#FFFBEB', text: '#D97706' },
    };
    return map[status] || map.draft;
  }

  /**
   * Check if a PDF exists at path
   */
  async pdfExists(path) {
    if (!path) return false;
    try {
      return await RNFS.exists(path);
    } catch {
      return false;
    }
  }

  /**
   * Delete a PDF file
   */
  async deletePdf(path) {
    if (!path) return;
    try {
      const exists = await RNFS.exists(path);
      if (exists) await RNFS.unlink(path);
    } catch (error) {
      console.error('[PdfService] Delete failed:', error);
    }
  }

  /**
   * Clear all temporary PDF files to keep the app lightweight
   */
  async cleanupCache() {
    try {
      const dir = Platform.OS === 'ios' ? RNFS.DocumentDirectoryPath : RNFS.ExternalDirectoryPath;
      const files = await RNFS.readDir(dir);
      
      const targets = files.filter(f => f.name.startsWith('invoice_') && f.name.endsWith('.pdf'));
      
      for (const file of targets) {
        await RNFS.unlink(file.path);
      }
      console.log(`[PdfService] Cleaned up ${targets.length} temporary files.`);
    } catch (err) {
      console.warn('[PdfService] Cache cleanup failed:', err);
    }
  }
}

export default new PdfService();
