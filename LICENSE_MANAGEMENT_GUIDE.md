# Invox License & Security Management Guide 🛡️

This guide explains how to manage product activation keys and understand the security architecture of the Invox application.

## 1. How it Works (Hardware Binding)
Invox uses a **Cloud-Bound Hardware Lock** system. 
- When a user enters a product key, the app sends their unique **Android Device ID** to Firebase.
- The key becomes "Locked" to that specific phone.
- If the same key is entered on a different phone, the activation will be rejected.
- If the user reinstalls the app on the *same* phone, the system recognizes them and re-activates automatically.

---

## 2. Managing Keys in Firebase Console

All keys are stored in your **Firebase Firestore** database under the `product_codes` collection.

### To Create a New Key:
1. Go to [Firebase Console](https://console.firebase.google.com/) > **Firestore Database**.
2. Click **Add Document** in the `product_codes` collection.
3. **Document ID**: Enter the product key (e.g., `ABCD-1234-EFGH`).
4. Add these fields:
   - `isUsed` (boolean): `false`
   - `deviceId` (string): (leave empty)
   - `reinstallCount` (number): `0`
5. Click **Save**.

### To Block/Disable a Key:
If you want to stop someone from using the app:
1. Find their key in Firestore.
2. Change `isUsed` to `true` and put a fake/random value in `deviceId`.
3. The app will fail to validate on their next check.

### To Reset a Key (Transfer to a new phone):
If a user buys a new phone and wants to move their license:
1. Find their key in Firestore.
2. Change `isUsed` to `false`.
3. Delete the value in `deviceId`.
4. Now they can use the same key on their new phone.

---

## 3. Security Architecture Details

### Tech Stack
- **Firebase Firestore**: Real-time cloud database for key validation.
- **React Native Device Info**: Used to generate the unique hardware fingerprint.
- **Zustand + SQLite**: Locally persists the activation status so the user can use the app offline after the first activation.

### Files Involved
- `src/services/SecurityService.js`: Logic for key verification.
- `src/services/FirebaseConfig.js`: Firebase connection setup.
- `src/presentation/screens/ActivationScreen.js`: The "Lock" screen UI.
- `src/presentation/navigation/AppNavigator.js`: Redirects unactivated users to the Lock screen.

---

## 4. Best Practices for the Admin
- **Key Format**: Use a consistent format like `INV-XXXX-XXXX` to make them look professional.
- **Database Rules**: Ensure your Firebase Rules are set to allow the app to read/write only the necessary fields.
- **Monitoring**: Check the `reinstallCount` field in Firestore. If it's very high (e.g., 50+), it might indicate someone is trying to bypass the system.

---

## 5. Troubleshooting
- **"ServerTimestamp" Error**: Ensure you have a stable internet connection during the first activation.
- **"Device Not Found"**: Make sure the phone has Google Play Services installed.
- **Firebase Permission Denied**: Check your Firestore Security Rules in the Firebase Console.
