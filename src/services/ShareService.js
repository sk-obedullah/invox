/**
 * Share Service
 * Handles sharing and printing invoices
 */

import Share from 'react-native-share';
import RNFS from 'react-native-fs';

class ShareService {
  /**
   * Share a PDF file via the system share sheet
   */
  async sharePdf(filePath, invoiceNumber) {
    try {
      const exists = await RNFS.exists(filePath);
      if (!exists) {
        throw new Error('PDF file not found');
      }

      const fileUrl = filePath.startsWith('file://') ? filePath : `file://${filePath}`;

      await Share.open({
        url: fileUrl,
        type: 'application/pdf',
        title: `Invoice ${invoiceNumber}`,
        subject: `Invoice ${invoiceNumber}`,
        message: `Please find attached Invoice ${invoiceNumber}`,
        failOnCancel: false,
      });

      return true;
    } catch (error) {
      if (error.message?.includes('User did not share')) {
        return false; // User cancelled
      }
      console.error('[ShareService] Share failed:', error);
      throw error;
    }
  }

  /**
   * Share a JSON backup file
   */
  async shareBackup(filePath) {
    try {
      await Share.open({
        url: `file://${filePath}`,
        type: 'application/json',
        title: 'Invox Backup',
        subject: 'Invox Data Backup',
        failOnCancel: false,
      });
      return true;
    } catch (error) {
      if (error.message?.includes('User did not share')) {
        return false;
      }
      throw error;
    }
  }
}

export default new ShareService();
