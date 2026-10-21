# Invox

> **A professional, offline-first invoicing app for small businesses**, built with React Native and SQLite.

<p align="center">
  <img src="docs/assets/banner.png" alt="Invox Banner" width="600" />
</p>

---

## 🚀 Features

- 📄 **Professional Invoice Creation** — Multi-item invoices with taxes, discounts, and custom numbering
- 👥 **Customer Management** — Full CRUD with smart recent-customer caching
- 📦 **Inventory Tracking** — Real-time stock deduction on invoicing, batch stock-ups, manual adjustments
- 🕰️ **Document Timeline** — Full audit trail of every status change and edit per invoice
- 📊 **Analytics Dashboard** — Revenue, profit margin, pending receivables, and top-item/customer reports
- 📑 **PDF Generation & Sharing** — Professional A4 PDF output with bank details & QR code payment page
- 💾 **V2 Backup & Restore** — Complete raw SQL mirroring of all 7 data tables with referential integrity
- 🔐 **License Activation** — Firebase-backed product key validation with hardware ID binding
- 🌗 **Dark / Light Theme** — Fully themeable UI

---

## 🏗️ Architecture

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the full system design including:
- Layer breakdown (Presentation → Service → Data)
- Entity-Relationship Diagram
- Data flow diagrams for invoice creation, status changes, and backup/restore

---

## 🗂️ Project Structure

```
Invox/
├── android/                  # Android native project
├── docs/                     # Documentation
│   ├── ARCHITECTURE.md       # System architecture & diagrams
│   └── CHANGELOG.md          # Release history
├── src/
│   ├── constants/            # App-wide constants (templates, statuses)
│   ├── data/
│   │   ├── database/
│   │   │   ├── DatabaseManager.js   # SQLite init & migration runner
│   │   │   └── schema.js            # All CREATE TABLE statements
│   │   └── repositories/
│   │       ├── InvoiceRepository.js
│   │       ├── CustomerRepository.js
│   │       ├── ItemRepository.js
│   │       └── SettingsRepository.js
│   ├── domain/models/        # Data shape definitions
│   ├── presentation/
│   │   ├── components/
│   │   │   ├── common/       # AppButton, AppCard, AppInput, etc.
│   │   │   └── invoice/      # LineItemRow, InvoiceSummary, StatusBadge
│   │   ├── navigation/       # React Navigation stack & tab config
│   │   └── screens/          # All app screens
│   ├── services/
│   │   ├── BackupService.js  # V2 raw SQL backup & restore
│   │   ├── PdfService.js     # HTML-to-PDF generation
│   │   ├── SecurityService.js # License validation
│   │   └── ShareService.js   # Native share sheet
│   ├── store/                # Zustand state stores
│   ├── theme/                # Colors, spacing, typography tokens
│   └── utils/                # Formatters, calculations, helpers
└── package.json
```

---

## ⚙️ Setup & Development

### Prerequisites
- Node.js >= 18
- React Native CLI
- Android Studio with SDK 36
- Java 17

### Install
```bash
npm install
```

### Run (Development)
```bash
npm start          # Start Metro bundler
npm run android    # Run on connected Android device/emulator
```

### Build Release APK
```bash
cd android
.\gradlew assembleRelease
```
Output: `android/app/build/outputs/apk/release/app-release.apk`

---

## 🔑 Critical Engineering Rules

> These rules exist because of real bugs found during the system audit. **Do not break them.**

1. **Never use `async/await` inside `database.transaction()` callbacks.**
   The `react-native-sqlite-storage` library does not await Promises inside the transaction callback. All multi-step operations should use sequential `await db.executeSql()` calls.

2. **Always use `total` (not `amount`) in `line_items`.**
   The DB schema defines `total` as the final calculated price column. Using `amount` will silently return `0` or fail with a constraint error.

3. **Backup must wipe before restore.**
   Attempting to re-insert records without first clearing the tables will fail on UNIQUE constraints (invoice_number) and will corrupt stock levels with duplicate inventory logs.

4. **Respect the Invoice Status Machine.**
   A `sent`, `paid`, or `overdue` invoice cannot be set back to `draft`. The UI enforces this, and the backend `updateStatus()` should validate it as well.

---

## 📋 Changelog

See [docs/CHANGELOG.md](docs/CHANGELOG.md).

---

## 📄 License

Proprietary — All rights reserved.
