# Invox — System Architecture

> A production-grade, offline-first invoicing app built with React Native and SQLite.

---

## Table of Contents

1. [High-Level Overview](#high-level-overview)
2. [Architecture Diagram](#architecture-diagram)
3. [Layer Breakdown](#layer-breakdown)
4. [Database Schema](#database-schema)
5. [Data Flow](#data-flow)
6. [Key Design Decisions](#key-design-decisions)

---

## High-Level Overview

Invox follows a strict **Clean Architecture** pattern with three clear layers:

```
┌────────────────────────────────────────────┐
│              Presentation Layer            │
│   Screens + Components + Zustand Stores    │
├────────────────────────────────────────────┤
│               Service Layer                │
│  PDF, Backup, Security, Share Services     │
├────────────────────────────────────────────┤
│              Data Layer                    │
│   Repositories + DatabaseManager          │
│          (SQLite — react-native-sqlite-storage)
└────────────────────────────────────────────┘
```

All data is stored **100% offline** on-device using SQLite. The only network calls are:
- **Firebase Firestore** — License key validation on first activation only.
- **QR Server API** — Optional UPI QR code generation for PDF invoices.

---

## Architecture Diagram

```
┌──────────────────────────────────────────────────────────┐
│                    React Native App                      │
│                                                          │
│  ┌──────────┐  ┌────────────┐  ┌──────────────────────┐ │
│  │  Screens │  │ Components │  │   Navigation (React  │ │
│  │          │  │            │  │   Navigation Stack)  │ │
│  └────┬─────┘  └─────┬──────┘  └──────────────────────┘ │
│       │               │                                  │
│       └───────┬───────┘                                  │
│               │                                          │
│       ┌───────▼──────────────────────────────────────┐   │
│       │              Zustand State Stores             │   │
│       │  useAppStore │ useInvoiceStore │ useItemStore │   │
│       │  useCustomerStore │ useSettingsStore          │   │
│       └───────┬──────────────────────────────────────┘   │
│               │                                          │
│       ┌───────▼──────────────────────────────────────┐   │
│       │              Service Layer                    │   │
│       │  PdfService │ BackupService │ SecurityService │   │
│       │  ShareService                                 │   │
│       └───────┬──────────────────────────────────────┘   │
│               │                                          │
│       ┌───────▼──────────────────────────────────────┐   │
│       │           Repository Layer (Data Access)      │   │
│       │  InvoiceRepository │ CustomerRepository       │   │
│       │  ItemRepository    │ SettingsRepository       │   │
│       └───────┬──────────────────────────────────────┘   │
│               │                                          │
│       ┌───────▼──────────────────────────────────────┐   │
│       │           DatabaseManager (SQLite)            │   │
│       │         schema.js + Migrations                │   │
│       └──────────────────────────────────────────────┘   │
│                                                          │
│  ─────────────── External Connections ─────────────────  │
│                                                          │
│  ┌───────────────────┐    ┌──────────────────────────┐   │
│  │  Firebase (Auth)  │    │  RNFS (File System)      │   │
│  │  License Key      │    │  Backup / PDF Storage    │   │
│  │  Validation       │    │                          │   │
│  └───────────────────┘    └──────────────────────────┘   │
└──────────────────────────────────────────────────────────┘
```

---

## Layer Breakdown

### 1. Presentation Layer (`src/presentation/`)

| File/Folder | Purpose |
|---|---|
| `screens/` | Full-page React Native screen components |
| `components/common/` | Reusable UI primitives (AppButton, AppCard, AppInput) |
| `components/invoice/` | Invoice-specific components (LineItemRow, InvoiceSummary, StatusBadge) |

**State Management — Zustand Stores (`src/store/`)**

| Store | Responsibility |
|---|---|
| `useAppStore` | Global app initialization, DB bootstrap sequence |
| `useSettingsStore` | Company settings, theme, defaults, `is_activated` barrier |
| `useInvoiceStore` | Invoice CRUD, status transitions, revision history |
| `useCustomerStore` | Customer CRUD, recent customer caching |
| `useItemStore` | Item/inventory CRUD, stock state |

---

### 2. Service Layer (`src/services/`)

| Service | Responsibility |
|---|---|
| `SecurityService.js` | Firebase Firestore license key validation, hardware ID binding |
| `PdfService.js` | HTML-to-PDF generation using `react-native-html-to-pdf`. Supports multiple templates. |
| `BackupService.js` | V2 Raw SQL table mirroring backup/restore with referential integrity & activation protection |
| `ShareService.js` | Native Android sharing of PDF files |

---

### 3. Data Layer (`src/data/`)

#### DatabaseManager (`src/data/database/DatabaseManager.js`)
- Opens and initializes the SQLite database on first launch.
- Runs all schema creation statements **sequentially** using `await db.executeSql()`.
- **Critical Rule**: Never uses `async/await` inside `db.transaction()` callbacks (not supported by the underlying SQLite library).

#### Repositories (`src/data/repositories/`)

| Repository | Key Operations |
|---|---|
| `SettingsRepository` | `get()`, `update()`, self-healing row insertion on init |
| `CustomerRepository` | Full CRUD + `getRecentlyUsed()` |
| `ItemRepository` | Full CRUD, `stockUp()`, `adjustStock()`, `getInventoryReport()` |
| `InvoiceRepository` | Full CRUD with transactional line-item management, status machine, revision snapshots, profit analytics |

---

## Database Schema

```
┌─────────────────────┐      ┌──────────────────────────────┐
│      settings       │      │          customers            │
│─────────────────────│      │──────────────────────────────│
│ id (PK)             │      │ id (PK)                      │
│ company_name        │      │ name                         │
│ company_email       │      │ email                        │
│ company_phone       │      │ phone                        │
│ company_address     │      │ address                      │
│ company_logo_path   │      │ gstin                        │
│ gstin               │      │ created_at                   │
│ invoice_prefix      │      │ updated_at                   │
│ next_invoice_number │      └──────────────┬───────────────┘
│ default_currency    │                     │ 1
│ default_tax_rate    │                     │
│ enable_tax          │      ┌──────────────▼───────────────┐
│ default_notes       │      │           invoices            │
│ default_terms       │      │──────────────────────────────│
│ bank_account_name   │      │ id (PK)                      │
│ bank_account_no     │      │ invoice_number (UNIQUE)      │
│ bank_ifsc           │      │ customer_id (FK → customers) │
│ bank_branch         │      │ customer_name                │
│ upi_id              │      │ status (draft/sent/paid/     │
│ qr_code_path        │      │         cancelled/overdue)   │
│ thanks_note         │      │ issue_date                   │
│ theme               │      │ due_date                     │
│ template            │      │ subtotal                     │
│ is_activated        │      │ tax_amount                   │
│ created_at          │      │ discount                     │
│ updated_at          │      │ total                        │
└─────────────────────┘      │ currency                     │
                             │ notes / terms                │
┌─────────────────────┐      │ revision_number              │
│        items        │      │ created_at / updated_at      │
│─────────────────────│      └──────────────┬───────────────┘
│ id (PK)             │                     │ 1
│ name                │                     │ ∞
│ description         │      ┌──────────────▼───────────────┐
│ unit_price          │      │          line_items           │
│ mrp_price           │      │──────────────────────────────│
│ purchase_price      │◄──── │ item_id (FK → items, NULL)   │
│ tax_rate            │      │ invoice_id (FK → invoices)   │
│ stock_quantity      │      │ name                         │
│ min_stock_level     │      │ description                  │
│ created_at          │      │ quantity                     │
│ updated_at          │      │ unit_price                   │
└─────────────────────┘      │ mrp_price                    │
         │                   │ purchase_price               │
         │ 1                 │ tax_rate / tax_amount        │
         │ ∞                 │ total                        │
┌────────▼────────────┐      │ sort_order                   │
│   inventory_logs    │      └──────────────────────────────┘
│─────────────────────│
│ id (PK)             │      ┌──────────────────────────────┐
│ item_id (FK)        │      │      invoice_revisions        │
│ type (in/out/adj)   │      │──────────────────────────────│
│ quantity            │      │ id (PK)                      │
│ price               │      │ invoice_id (FK → invoices)   │
│ reference_id        │      │ revision_number              │
│ batch_number        │      │ snapshot_json (full JSON)    │
│ notes               │      │ reason                       │
│ created_at          │      │ created_at                   │
└─────────────────────┘      └──────────────────────────────┘
```

---

## Data Flow

### Invoice Creation Flow

```
User fills CreateInvoiceScreen
          │
          ▼
LineItemRow calculates: qty × price + tax = total
          │
          ▼
handleSave() → useInvoiceStore.createInvoice()
          │
          ▼
InvoiceRepository.create(invoiceData, lineItems)
          │
     ┌────┴────┐
     │ DB TX   │
     │ 1. INSERT invoices → get insertId
     │ 2. INSERT line_items (for each)
     │ 3. If status=paid/sent: UPDATE items.stock_quantity -= qty
     │ 4. INSERT inventory_logs (OUT)
     └─────────┘
          │
          ▼
  Invoice Created ✓  →  Navigate to InvoiceDetailScreen
```

### Status Change Flow

```
User taps Status Button (e.g., Mark as Paid)
          │
          ▼
InvoiceRepository.updateStatus(invoiceId, newStatus)
          │
     Sequential await (NOT inside transaction):
     1. SELECT old status
     2. If cancelled → UPDATE items.stock_quantity += qty (restock)
     3. INSERT inventory_logs (IN — restock event)
     4. UPDATE invoices SET status = newStatus
     5. createRevision() → INSERT invoice_revisions (JSON snapshot)
          │
          ▼
  UI refreshes → Document Timeline updates with "STATUS UPDATE" badge
```

### Backup & Restore Flow (V2)

```
CREATE BACKUP                     RESTORE BACKUP
──────────────                    ───────────────
SELECT * FROM settings            READ file → parse JSON
SELECT * FROM customers           Validate: app === 'Invox'
SELECT * FROM items               DELETE invoice_revisions
SELECT * FROM invoices            DELETE inventory_logs
SELECT * FROM line_items          DELETE line_items
SELECT * FROM inventory_logs      DELETE invoices
SELECT * FROM invoice_revisions   DELETE items
         │                        DELETE customers
         ▼                                │
  JSON.stringify → write file             ▼
  invox_backup_YYYY-MM-DD.json    INSERT customers (with IDs)
                                  INSERT items (with IDs)
                                  INSERT invoices (with IDs)
                                  INSERT line_items (with IDs)
                                  INSERT inventory_logs
                                  INSERT invoice_revisions
                                  ⚠️  Preserve is_activated from device
```

---

## Key Design Decisions

| Decision | Rationale |
|---|---|
| **No async inside `db.transaction()`** | `react-native-sqlite-storage` does not await promises inside the transaction callback. All async DB operations use sequential `await db.executeSql()` calls instead. |
| **Zustand over Redux** | Lightweight, boilerplate-free, and perfect for the scale of this app. Avoids action/reducer complexity. |
| **Self-Healing Settings Row** | On first install, if the DB init glitches, `SettingsRepository` auto-inserts a default row to prevent infinite activation loops. |
| **V2 Raw SQL Backup** | Instead of re-creating records via Repository methods (which lose IDs and break FK relations), V2 backups do a true table-level mirror, preserving all primary keys and foreign key links. |
| **Immutable Invoice History** | Once an invoice leaves `draft`, it cannot return. All changes trigger a `invoice_revisions` snapshot, creating a tamper-evident audit trail. |
| **Stock Deduction on Finalization** | Stock is only deducted when invoice status is `sent` or `paid` — never on `draft`. On `cancelled`, stock is automatically restored. |
