# Security Activation Plan 🛡️

To implement a single-use product code system that survives reinstalls, we need a small cloud-based check. A local-only solution is not possible because a reinstall wipes all local data.

## 🚀 Recommended Architecture: Firebase Firestore

### 1. The Logic
- **Firestore Collection**: `product_codes`
- **Document Structure**:
  ```json
  {
    "code": "ABCD-1234",
    "isUsed": false,
    "deviceId": "",
    "usedAt": null
  }
  ```

### 2. The App Flow
1. **First Launch**: App checks local storage for `isActivated: true`.
2. **Activation Screen**: If not activated, the app shows a screen asking for the "Product Key".
3. **Hardware Binding**: The app retrieves a unique Device ID (using `react-native-device-info`).
4. **Cloud Check**:
   - The app sends the `code` and `deviceId` to Firebase.
   - **Case A (New Code)**: Server sees `isUsed: false`. It sets `isUsed: true` and `deviceId: CurrentDeviceID`. Activation Success.
   - **Case B (Reinstall)**: Server sees `isUsed: true`. It checks if the `deviceId` matches the one on record. If it matches, it allows activation (Success). If not, it blocks it (Fail).
   - **Case C (Invalid)**: Code not found. (Fail).

### 3. Dependencies Needed
- `@react-native-firebase/app`
- `@react-native-firebase/firestore`
- `react-native-device-info`

---

## 🛠️ Implementation Steps (Branch: feature/security-activation)

### Phase 1: Infrastructure
- Install and configure Firebase for Android.
- Install `react-native-device-info`.

### Phase 2: Navigation Middleware
- Create `ActivationScreen.js`.
- Update `AppNavigator.js` to prevent access to the Home screen unless `isActivated` is true in the Zustand store.

### Phase 3: Verification Logic
- Implement the Firestore lookup logic.
- Add a "Loading" state during activation.

---

**Would you like me to start by setting up the Activation Screen UI and the navigation logic?**
