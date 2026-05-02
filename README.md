# Invox 📄
Professional Invoicing Made Simple.

**Invox** is a high-performance, professional invoice management application built with React Native. It allows users to manage customers, track items, and generate beautiful, enterprise-grade PDF invoices in seconds.

## 🚀 Key Features
- **Intelligent Invoicing**: Streamlined creation flow with automated tax and total calculations.
- **Save & Send**: One-tap workflow to save invoices, generate PDFs, and open the system share menu.
- **Offline First**: Robust local data storage using SQLite.
- **QR Code Payments**: Support for custom UPI and payment QR codes on generated PDFs.
- **Professional Templates**: Modern, clean PDF designs ready for business use.
- **Backup & Restore**: Easily backup your data to local storage and restore it anytime.

## 🛠️ Tech Stack
- **Framework**: React Native
- **State Management**: Zustand
- **Database**: SQLite (via `react-native-sqlite-storage`)
- **PDF Engine**: `react-native-html-to-pdf`
- **Styling**: Vanilla Stylesheets with a custom design system
- **Animations**: Reanimated 3

## 🏗️ Architecture
The project follows **Clean Architecture** principles:
- **Presentation Layer**: React Native components and screens using a custom theme.
- **Domain Layer**: Zod schemas and business models.
- **Data Layer**: Repository pattern for database access and persistence.
- **Service Layer**: Infrastructure services for PDF generation, sharing, and backups.

## 📦 Getting Started
1. Install dependencies: `npm install`
2. Start Metro: `npm start`
3. Run on Android: `npm run android`

---
Built with ❤️ for professional efficiency.

When you want to forcefully reload, for example to reset the state of your app, you can perform a full reload:

- **Android**: Press the <kbd>R</kbd> key twice or select **"Reload"** from the **Dev Menu**, accessed via <kbd>Ctrl</kbd> + <kbd>M</kbd> (Windows/Linux) or <kbd>Cmd ⌘</kbd> + <kbd>M</kbd> (macOS).
## Congratulations! :tada:

You've successfully run and modified your React Native App. :partying_face:

### Now what?

- If you want to add this new React Native code to an existing application, check out the [Integration guide](https://reactnative.dev/docs/integration-with-existing-apps).
- If you're curious to learn more about React Native, check out the [docs](https://reactnative.dev/docs/getting-started).

# Troubleshooting

If you're having issues getting the above steps to work, see the [Troubleshooting](https://reactnative.dev/docs/troubleshooting) page.

# Learn More

To learn more about React Native, take a look at the following resources:

- [React Native Website](https://reactnative.dev) - learn more about React Native.
- [Getting Started](https://reactnative.dev/docs/environment-setup) - an **overview** of React Native and how setup your environment.
- [Learn the Basics](https://reactnative.dev/docs/getting-started) - a **guided tour** of the React Native **basics**.
- [Blog](https://reactnative.dev/blog) - read the latest official React Native **Blog** posts.
- [`@facebook/react-native`](https://github.com/facebook/react-native) - the Open Source; GitHub **repository** for React Native.
