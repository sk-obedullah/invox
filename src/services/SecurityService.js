import { db, firestore } from './FirebaseConfig';
import DeviceInfo from 'react-native-device-info';

class SecurityService {
  /**
   * Get unique hardware ID for this device
   */
  async getDeviceId() {
    try {
      return await DeviceInfo.getUniqueId();
    } catch (e) {
      console.error('[Security] Failed to get Device ID:', e);
      return 'UNKNOWN_DEVICE';
    }
  }

  /**
   * Verify a product key against Firestore
   * Logic:
   * 1. Code must exist in 'product_codes' collection
   * 2. If 'isUsed' is false, activate and bind to this device
   * 3. If 'isUsed' is true, allow only if 'deviceId' matches this device
   */
  async activateProduct(key) {
    const deviceId = await this.getDeviceId();
    const cleanKey = key.trim().toUpperCase();

    try {
      const doc = await db.collection('product_codes').doc(cleanKey).get();

      if (!doc.exists) {
        throw new Error('Invalid product code. Please check and try again.');
      }

      const data = doc.data();

      // Case 1: Code is new/unused
      if (!data.isUsed) {
        await db.collection('product_codes').doc(cleanKey).update({
          isUsed: true,
          deviceId: deviceId,
          usedAt: firestore.FieldValue.serverTimestamp(),
          reinstallCount: 0
        });
        return true;
      }

      // Case 2: Code is used by THIS device (Reinstall)
      if (data.deviceId === deviceId) {
        await db.collection('product_codes').doc(cleanKey).update({
          reinstallCount: (data.reinstallCount || 0) + 1,
          lastReinstallAt: firestore.FieldValue.serverTimestamp(),
        });
        return true;
      }

      // Case 3: Code is used by ANOTHER device
      throw new Error('This product code has already been activated on another device.');

    } catch (error) {
      console.error('[Security] Activation error:', error);
      throw error;
    }
  }
}

export default new SecurityService();
