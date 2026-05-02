/**
 * PDF Generation Service
 * Generates professional invoice PDFs using HTML templates
 */

import { Platform } from 'react-native';
import { generatePDF } from 'react-native-html-to-pdf';
import RNFS from 'react-native-fs';
import { formatCurrency, formatDate } from '../utils/formatters';
import { TEMPLATE_IDS } from '../constants/templates';

class PdfService {
  /**
   * Generate an invoice PDF
   */
  async generateInvoicePdf(invoice, settings, templateId = TEMPLATE_IDS.MODERN) {
    try {
      const html = await this.buildHtml(invoice, settings, templateId);

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
    const logoHtml = logoSrc
      ? `<img src="${logoSrc}" />`
      : `<h1 style="font-size: 36px; color: #1e3a5f; font-weight: 700; letter-spacing: 2px;">${settings.company_name || 'COMPANY NAME'}</h1>`;

    const customQrSrc = await this.getImageBase64(settings.qr_code_path);
    const upiQrSrc = settings.upi_id 
      ? `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=upi://pay?pa=${encodeURIComponent(settings.upi_id)}%26pn=${encodeURIComponent(settings.bank_account_name || settings.company_name || 'Payment')}`
      : null;
    
    const finalQrSrc = customQrSrc || upiQrSrc;

    const lineItemsHtml = (invoice.line_items || [])
      .map(
        (item) => `
      <tr>
        <td>
          ${item.name}
          ${item.description ? `<br/><span style="font-size: 13px; color: #777; display: inline-block; margin-top: 2px;">${item.description}</span>` : ''}
        </td>
        <td class="center">${formatCurrency(item.unit_price, invoice.currency)}</td>
        <td class="center">${item.quantity}</td>
        <td class="right">${formatCurrency(item.amount, invoice.currency)}</td>
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
        body { font-family: 'Montserrat', sans-serif; font-size: 15px; color: #333; line-height: 1.6; background: #fff; }
        .container { max-width: 100%; margin: 0 auto; padding: 0; position: relative; min-height: 100vh; padding-bottom: 80px; }
        
        .logo-container { text-align: center; padding: 30px 0 20px; }
        .logo-container img { max-height: 120px; max-width: 80%; object-fit: contain; }

        .banner { display: flex; align-items: center; margin-bottom: 35px; }
        .banner-left { width: 45px; height: 45px; background-color: #10b3d6; margin-right: 15px; }
        .banner-sep { width: 15px; height: 45px; background-color: #10b3d6; margin-right: 25px; }
        .banner-title { font-size: 46px; font-weight: 700; color: #1e3a5f; letter-spacing: 4px; margin-right: 25px; line-height: 45px; }
        .banner-right { flex-grow: 1; height: 45px; background-color: #10b3d6; }

        .info-section { display: flex; justify-content: space-between; padding: 0 80px; margin-bottom: 35px; }
        .info-col { width: 45%; display: flex; }
        .info-label { width: 80px; color: #555; font-size: 15px; }
        .info-value { flex-grow: 1; color: #333; font-size: 15px; }
        .info-value strong { font-weight: 600; color: #000; font-size: 15px; }

        .invoice-info { display: flex; flex-direction: column; }
        .invoice-info-row { display: flex; margin-bottom: 4px; }
        .invoice-info-value { font-weight: 600; color: #000; font-size: 15px; }
        .invoice-info-subtext { color: #555; font-size: 14px; margin-top: 4px; }

        table { width: 100%; border-collapse: collapse; margin-bottom: 0; }
        thead { background-color: #F8F9FA; border-bottom: 2px solid #eaeaea; border-top: 1px solid #eaeaea; }
        th { padding: 10px 20px; text-align: left; font-size: 14px; font-weight: 700; letter-spacing: 1px; color: #000; text-transform: uppercase; border: none; }
        th:first-child { padding-left: 80px; width: 45%; }
        th:last-child { padding-right: 80px; }
        th.center { text-align: center; }
        th.right { text-align: right; }
        td { padding: 8px 20px; color: #444; font-size: 15px; border: none; vertical-align: top; }
        td:first-child { padding-left: 80px; }
        td:last-child { padding-right: 80px; }
        td.center { text-align: center; }
        td.right { text-align: right; }
        tbody tr:nth-child(even) { background-color: #F8F9FA; }
        tbody tr:nth-child(odd) { background-color: #fff; }

        .totals-section { display: flex; justify-content: space-between; padding: 25px 80px 20px; }
        .remarks { width: 50%; }
        .remarks-title { font-weight: 700; color: #000; font-size: 15px; letter-spacing: 1px; margin-bottom: 8px; text-transform: uppercase; }
        .remarks p { color: #555; line-height: 1.6; font-size: 14px; }
        
        .totals { width: 40%; }
        .total-row { display: flex; justify-content: space-between; margin-bottom: 8px; color: #555; font-size: 15px; letter-spacing: 0.5px; }
        .total-row span:nth-child(2) { color: #000; }
        .total-row.final { font-weight: 700; color: #000; font-size: 20px; margin-top: 12px; letter-spacing: 1px; }
        .total-row.final span:nth-child(1) { text-transform: uppercase; }

        .footer { position: fixed; bottom: 30px; left: 0; right: 0; display: flex; justify-content: center; gap: 40px; color: #555; font-size: 13px; letter-spacing: 1px; }
        .footer-item { display: flex; align-items: center; gap: 8px; }
        .footer-icon { font-size: 17px; }
      </style>
    </head>
    <body>
      <div class="container">
        
        <div class="logo-container">
          ${logoHtml}
        </div>
        
        <div class="banner">
          <div class="banner-left"></div>
          <div class="banner-sep"></div>
          <div class="banner-title">INVOICE</div>
          <div class="banner-right"></div>
        </div>
        
        <div class="info-section">
          <div class="info-col">
            <div class="info-label">Billing to:</div>
            <div class="info-value">
              <strong>${invoice.customer_name || 'N/A'}</strong><br/>
              ${invoice.customer_address ? invoice.customer_address.replace(/\\n/g, '<br/>') : ''}
            </div>
          </div>
          <div class="info-col" style="padding-left: 20px;">
            <div class="invoice-info">
              <div class="invoice-info-row">
                <div class="invoice-info-value">Invoice: ${invoice.invoice_number}</div>
              </div>
              <div class="invoice-info-subtext">${formatDate(invoice.issue_date, 'DD MMM YYYY, HH:mm:ss')}</div>
            </div>
          </div>
        </div>
        
        <table>
          <thead>
            <tr>
              <th>ITEMS</th>
              <th class="center">PRICE</th>
              <th class="center">QUANTITY</th>
              <th class="right">AMOUNT</th>
            </tr>
          </thead>
          <tbody>
            ${lineItemsHtml}
          </tbody>
        </table>
        
        <div class="totals-section">
          <div class="remarks">
            <div class="remarks-title">REMARKS:</div>
            <p>${invoice.terms || invoice.notes || 'Please make your check payable to<br/>' + (settings.company_name || 'Us') + '. Thank you!'}</p>
          </div>
          <div class="totals">
            <div class="total-row">
              <span>Subtotal</span>
              <span>${formatCurrency(invoice.subtotal, invoice.currency)}</span>
            </div>
            ${invoice.tax_amount > 0 ? `
            <div class="total-row">
              <span>Tax</span>
              <span>${formatCurrency(invoice.tax_amount, invoice.currency)}</span>
            </div>` : ''}
            ${invoice.discount > 0 ? `
            <div class="total-row">
              <span>Discount</span>
              <span>- ${formatCurrency(invoice.discount, invoice.currency)}</span>
            </div>` : ''}
            <div class="total-row final">
              <span>TOTAL</span>
              <span>${formatCurrency(invoice.total, invoice.currency)}</span>
            </div>
          </div>
        </div>
        
        <div class="footer">
          ${settings.website ? `
          <div class="footer-item">
            <span class="footer-icon">🔗</span>
            <span>${settings.website}</span>
          </div>` : ''}
          ${settings.company_email ? `
          <div class="footer-item">
            <span class="footer-icon">✉️</span>
            <span>${settings.company_email}</span>
          </div>` : ''}
          ${settings.company_phone ? `
          <div class="footer-item">
            <span class="footer-icon">📱</span>
            <span>${settings.company_phone}</span>
          </div>` : ''}
        </div>
        
      </div>

      ${(settings.bank_account_no || settings.upi_id || customQrSrc || settings.thanks_note) ? `
      <div class="container" style="page-break-before: always; padding: 60px 80px;">
        <div style="text-align: center; margin-bottom: 50px;">
          <h2 style="color: #1e3a5f; font-size: 26px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase;">Payment Instructions</h2>
          <div style="width: 60px; height: 4px; background: #10b3d6; margin: 15px auto;"></div>
        </div>
        
        <div style="display: flex; gap: 40px; align-items: flex-start; margin-bottom: 60px;">
          <!-- Bank Details Card -->
          <div style="flex: 1.2; background: #ffffff; border: 1px solid #e1e8f0; border-radius: 16px; padding: 30px; box-shadow: 0 4px 12px rgba(0,0,0,0.03);">
            <div style="display: flex; align-items: center; margin-bottom: 25px;">
              <div style="width: 10px; height: 10px; background: #10b3d6; border-radius: 50%; margin-right: 12px;"></div>
              <h3 style="font-size: 16px; font-weight: 700; color: #1e3a5f; text-transform: uppercase; letter-spacing: 1px;">Bank Account Details</h3>
            </div>
            
            <div style="display: grid; gap: 18px;">
              ${settings.bank_account_name ? `
                <div style="display: flex; border-bottom: 1px solid #f0f4f8; padding-bottom: 12px;">
                  <span style="width: 130px; color: #718096; font-size: 13px; font-weight: 600; text-transform: uppercase;">Beneficiary</span>
                  <span style="color: #2d3748; font-size: 15px; font-weight: 600;">${settings.bank_account_name}</span>
                </div>` : ''}
              ${settings.bank_account_no ? `
                <div style="display: flex; border-bottom: 1px solid #f0f4f8; padding-bottom: 12px;">
                  <span style="width: 130px; color: #718096; font-size: 13px; font-weight: 600; text-transform: uppercase;">Account No</span>
                  <span style="color: #2d3748; font-size: 16px; font-weight: 700; letter-spacing: 0.5px;">${settings.bank_account_no}</span>
                </div>` : ''}
              ${settings.bank_ifsc ? `
                <div style="display: flex; border-bottom: 1px solid #f0f4f8; padding-bottom: 12px;">
                  <span style="width: 130px; color: #718096; font-size: 13px; font-weight: 600; text-transform: uppercase;">IFSC Code</span>
                  <span style="color: #2d3748; font-size: 15px; font-weight: 600; font-family: monospace;">${settings.bank_ifsc}</span>
                </div>` : ''}
              ${settings.bank_branch ? `
                <div style="display: flex; border-bottom: 1px solid #f0f4f8; padding-bottom: 12px;">
                  <span style="width: 130px; color: #718096; font-size: 13px; font-weight: 600; text-transform: uppercase;">Branch</span>
                  <span style="color: #2d3748; font-size: 14px; font-weight: 500;">${settings.bank_branch}</span>
                </div>` : ''}
              ${settings.bank_mobile ? `
                <div style="display: flex;">
                  <span style="width: 130px; color: #718096; font-size: 13px; font-weight: 600; text-transform: uppercase;">Contact</span>
                  <span style="color: #2d3748; font-size: 14px; font-weight: 500;">${settings.bank_mobile}</span>
                </div>` : ''}
            </div>
          </div>
          
          <!-- QR Code Card -->
          <div style="flex: 0.8; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 30px; text-align: center;">
            <div style="margin-bottom: 20px;">
              <h3 style="font-size: 14px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 1px;">Quick Pay</h3>
            </div>
            
            ${finalQrSrc ? `
              <div style="background: #fff; padding: 15px; display: inline-block; border-radius: 12px; border: 1px solid #e2e8f0; margin-bottom: 20px;">
                <img src="${finalQrSrc}" style="width: 160px; height: 160px; display: block;" />
              </div>
              <p style="color: #64748b; font-size: 12px; margin-bottom: 10px; font-weight: 500;">Scan this QR code using any payment app</p>
            ` : ''}
            
            ${settings.upi_id ? `
              <div style="padding: 10px; background: #fff; border-radius: 8px; border: 1px solid #e2e8f0;">
                <span style="display: block; font-size: 11px; color: #94a3b8; font-weight: 600; text-transform: uppercase; margin-bottom: 4px;">UPI ID</span>
                <span style="display: block; font-size: 14px; font-weight: 700; color: #1e293b; word-break: break-all;">${settings.upi_id}</span>
              </div>
            ` : ''}
          </div>
        </div>
        
        <div style="text-align: center; margin-top: 40px; padding: 40px; border-top: 2px dashed #e2e8f0;">
          <h2 style="font-size: 32px; font-weight: 700; color: #1e3a5f; margin-bottom: 15px; font-style: italic;">${settings.thanks_note || 'Thank you for your business!'}</h2>
          <p style="color: #64748b; font-size: 15px; max-width: 500px; margin: 0 auto; line-height: 1.6;">We appreciate your partnership. For any payment related queries, please reach out to us at ${settings.company_email || 'our official email'}.</p>
        </div>
        
        <div style="position: absolute; bottom: 40px; left: 80px; right: 80px; text-align: center; color: #94a3b8; font-size: 11px; letter-spacing: 1px; text-transform: uppercase;">
          This is a computer-generated document. No signature is required for payment details.
        </div>
      </div>
      ` : ''}
      
    </body>
    </html>
    `;
  }

  getTemplateStyles(templateId) {
    switch (templateId) {
      case TEMPLATE_IDS.CLASSIC:
        return `body { font-family: 'Georgia', serif; }`;
      case TEMPLATE_IDS.MINIMAL:
        return `body { font-family: 'Helvetica Neue', Arial, sans-serif; }`;
      default:
        return `body { font-family: 'Helvetica Neue', Arial, sans-serif; }`;
    }
  }

  getStatusColor(status) {
    const map = {
      draft: { bg: '#F3F4F6', text: '#6B7280' },
      sent: { bg: '#EEF2FF', text: '#4F46E5' },
      paid: { bg: '#ECFDF5', text: '#059669' },
      overdue: { bg: '#FFF1F2', text: '#E11D48' },
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
}

export default new PdfService();
