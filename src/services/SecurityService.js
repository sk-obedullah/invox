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
   * 2. If 'isUsed' is false or no deviceId is bound, activate and bind to this device
   * 3. If 'isUsed' is true, allow only if 'deviceId' matches this device
   */
  async activateProduct(key) {
    const deviceId = await this.getDeviceId();
    const rawKey = (key || '').trim();

    if (!rawKey) {
      throw new Error('Please enter a valid product code.');
    }

    const isDocExists = (docSnapshot) => {
      if (!docSnapshot) return false;
      return typeof docSnapshot.exists === 'function' ? docSnapshot.exists() : !!docSnapshot.exists;
    };

    // Generate candidate variants to be resilient to casing and hyphen/underscore typos
    const candidates = Array.from(new Set([
      rawKey,
      rawKey.toUpperCase(),
      rawKey.toLowerCase(),
      rawKey.replace(/-/g, '_'),
      rawKey.replace(/-/g, '_').toUpperCase(),
      rawKey.replace(/_/g, '-'),
      rawKey.replace(/_/g, '-').toUpperCase(),
    ]));

    try {
      let targetDoc = null;
      let matchedKey = null;

      for (const candidate of candidates) {
        try {
          const doc = await db.collection('product_codes').doc(candidate).get();
          if (isDocExists(doc)) {
            targetDoc = doc;
            matchedKey = candidate;
            break;
          }
        } catch (err) {
          // Continue to next candidate if single doc get fails
          console.warn('[Security] Candidate lookup error for', candidate, err.message);
        }
      }

      if (!targetDoc || !isDocExists(targetDoc)) {
        throw new Error('Invalid product code. Please check and try again.');
      }

      const data = targetDoc.data();
      if (!data) {
        throw new Error('Invalid product code details. Please contact support.');
      }

      // Case 1: Code is new/unused OR has never been bound to a device
      if (!data.isUsed || !data.deviceId) {
        await db.collection('product_codes').doc(matchedKey).update({
          isUsed: true,
          deviceId: deviceId,
          usedAt: firestore.FieldValue.serverTimestamp(),
          reinstallCount: 0
        });
        return true;
      }

      // Case 2: Code is used by THIS device (Reinstall)
      if (data.deviceId === deviceId) {
        await db.collection('product_codes').doc(matchedKey).update({
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
