# Invox — Release Changelog

All notable changes to the Invox app are documented in this file.

---

## [v1.2.0] - 2026-05-19 — System Audit & Stability Release

### 🛠️ Bug Fixes

#### Invoice & Line Items
- **Fixed: Line item prices showing 0 on Invoice Detail screen** — The UI was reading `item.amount` but the schema/calculation engine outputs `item.total`. Fixed to use `item.total || item.amount` for backward compatibility.
- **Fixed: FOREIGN KEY constraint failed (code 787)** — Invoice creation was crashing because line-item SQL was inserting into an `amount` column that does not exist in the schema. Fixed to correctly use the `total` column.

#### Database Transactions
- **Fixed: "Transaction Closed" crash on status update** — `InvoiceRepository.updateStatus()` was using `async/await` inside a `database.transaction()` callback. `react-native-sqlite-storage` does not support this pattern. Refactored to sequential `await db.executeSql()` calls.

#### Activation / Settings
- **Fixed: App asking for product key on every launch** — A race condition in `DatabaseManager` initialization meant the `settings` row was sometimes never created. Implemented a "Self-Healing" mechanism in `SettingsRepository` that auto-inserts the default row if missing, and refactored `DatabaseManager` to use strict sequential initialization.

#### Screens / Forms
- **Fixed: CustomerFormScreen crash on open** — Missing `KeyboardAvoidingView` and `Platform` imports were causing an immediate crash when navigating to the Add Customer screen.
- **Fixed: ItemFormScreen crash on add** — Calling `.trim()` on a potentially `undefined` description field caused a silent crash. Added safe null-coalescing before all `trim()` calls.

---

### ✨ New Features

#### Document Timeline (Invoice History)
- Added a visual **Document Timeline** to every invoice detail page, showing the full lifecycle of the document.
- The timeline now displays descriptive event badges instead of generic version numbers:
  - 🟢 **DOCUMENT CREATED** — The initial draft event.
  - 🟡 **STATUS UPDATE** — When the invoice was sent, paid, cancelled, or marked overdue.
  - 🔵 **DOCUMENT EDITED** — When line items or invoice details were changed.
- Each event shows a precise timestamp and a human-readable description.

#### Backup & Restore (V2 — Complete Overhaul)
- **Complete rewrite** of `BackupService.js` from a fragile "re-create" strategy to a **Raw SQL Mirror** strategy.
- Backup now captures all 7 tables at the raw SQL level: `settings`, `customers`, `items`, `invoices`, `line_items`, `inventory_logs`, `invoice_revisions`.
- Restore performs a safe wipe-and-reinject that preserves all primary keys and foreign key relationships, eliminating duplicate records and stock corruption.
- **Activation Protection**: Restoring a backup from before activation never un-licenses the device. The `is_activated` flag is always preserved from the device.
- **Legacy Support**: V1 backup files created by older app versions are still fully restorable.
- **Fixed: Missing `getAllForExport()` method** in `InvoiceRepository` — The service was calling a method that didn't exist, causing backup creation to crash silently.

#### Analytics Dashboard
- Added a new **Dashboard / Analytics** screen with profit, revenue, and inventory reports.
- New screens: `DashboardScreen.js`, `InventoryReportScreen.js`, `AnalyticsInfoScreen.js`.

#### Invoice Management
- Added **Archived Invoices** screen (`ArchivedInvoicesScreen.js`).
- Added **Archived Items** screen (`ArchivedItemsScreen.js`).
- Invoice status now enforces a strict one-way state machine — a sent/paid invoice **cannot** be reverted to draft.
- Cancelling a finalized invoice automatically **restores stock** for all associated line items.

---

### 🔧 Optimizations & Refactoring

- **`InvoiceRepository`**: Added `getAllForExport()`, `createRevision()`, `getProfitStats()`, and full audit-log-aware status transitions.
- **`BackupService`**: Full V2 rewrite with raw SQL mirroring and activation protection.
- **`DatabaseManager`**: Migrated from transaction-based init to safe sequential `executeSql` calls.
- **`schema.js`**: Normalized `line_items` table — all pricing uses the `total` column. Removed the stale `amount` alias from INSERT queries.
- **`calculations.js`**: `calculateLineItem` returns `total` (not `amount`) to align with the DB schema.
- **`colors.js`**: Added `warningLight`, `successLight`, `primaryLight`, and `errorLight` semantic color tokens for badge/alert UI components.

---

## [v1.1.0] - 2026-04-26 — Feature Build

### ✨ New Features
- Invoice creation with multi-item line items
- Customer management (CRUD)
- Inventory/Item management with stock tracking
- PDF generation and sharing
- App-level settings with company profile
- License key activation via Firebase

---

## [v1.0.0] - 2026-03-06 — Initial Release

- Core invoice creation and viewing
- Basic customer management
- Local SQLite storage
