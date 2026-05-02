# Invox Developer & Deployment Guide 🚀

This guide provides step-by-step instructions on how to setup, run, and package the **Invox** Invoicing Application.

---

## 1. Prerequisites 📋

Before you begin, ensure you have the following installed on your machine:

- **Node.js** (v18 or higher)
- **Java Development Kit (JDK)** (v17 recommended for React Native 0.73+)
- **Android Studio**:
  - Android SDK
  - Android SDK Platform
  - Android Virtual Device (Emulator)
- **Git**

---

## 2. Local Setup & Running 💻

### Step 1: Clone the Repository
```bash
git clone https://github.com/sk-obedullah/invox.git
cd invox
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Start the Metro Bundler
Metro is the JavaScript bundler that ships with React Native.
```bash
npm start
```

### Step 4: Run on Android (Emulator)
Open a new terminal and run:
```bash
npm run android
```

---

## 3. Running on a Physical Phone 📱

To test the app on your own Android device:

1. **Enable Developer Options**: Go to `Settings > About Phone` and tap `Build Number` 7 times.
2. **Enable USB Debugging**: Go to `Settings > Developer Options` and toggle `USB Debugging` ON.
3. **Connect via USB**: Plug your phone into your computer.
4. **Verify Connection**: Run `adb devices`. You should see your device ID.
5. **Run the App**:
   ```bash
   npm run android
   ```

---

## 4. Production Packaging (APK & AAB) 📦

### Step 1: The Signing Key
The app is already configured with a production keystore located at `android/app/invox.keystore`.
- **Alias**: `invox-key`
- **Password**: `invox123`

### Step 2: Generate an AAB (For Play Store)
The Google Play Store requires the `.aab` format.
```bash
cd android
./gradlew bundleRelease
```
**Output Path**: `android/app/build/outputs/bundle/release/app-release.aab`

### Step 3: Generate an APK (For Direct Sharing)
If you want to share the app via WhatsApp or Email:
```bash
cd android
./gradlew assembleRelease
```
**Output Path**: `android/app/build/outputs/apk/release/app-release.apk`

---

## 5. UI Responsiveness 📐

Invox uses a custom responsive engine located in `src/utils/responsive.js`. 
- **Font Scaling**: Use `moderateFontScale(size)` for all text.
- **Spacing**: Use `moderateScale(size)` for padding and margins.
- **Auto-Stacking**: Rows in forms will automatically stack vertically on screens smaller than 360px wide.

---

## 6. Troubleshooting 🛠️

### Build Fails?
Try cleaning the Gradle cache:
```bash
cd android
./gradlew clean
cd ..
npm run android
```

### ProGuard Issues?
If the app crashes in release mode, check `android/app/proguard-rules.pro`. We have already added rules for PDF and SQLite libraries, but new libraries may need additional "keep" rules.

---

Built with ❤️ by the Invox Team.
