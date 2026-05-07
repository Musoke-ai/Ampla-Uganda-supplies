# Ampla Uganda Project Documentation

## Purpose and Audience
This document explains what each major section of the application does, how it works at a high level, and why it exists. It is written for stakeholders, developers, and operators who need a clear map of the system’s features and flows.

---

## 1. Project Overview (What & Why)
The project is a React-based inventory and point-of-sale (POS) system for Ampla Uganda. It supports sales, customer management, stock control, and business operations such as production tracking and expenses. It integrates role-based access control and real-time updates for operational accuracy.

Why this exists:
- Small and growing businesses need to track stock, sales, customers, and production in one place.
- Operators need a fast POS workflow with receipts and credit tracking.
- Managers need analytics, reports, and operational oversight.

---

## 2. Application Structure (How it’s organized)
The app is built with Create React App and uses React Router for page navigation. Feature code lives under `src/app`, with components in feature‑specific folders and data access through Redux Toolkit + RTK Query.

Key structural layers:
- **Routing Layer**: Defines public vs. protected routes and role‑restricted features.
- **State/Data Layer**: Redux Toolkit slices + RTK Query for fetch/update.
- **UI Layer**: React components. MUI is the primary standard for new UI work; React Bootstrap remains only for legacy screens during migration.

---

## 3. Routing and Access Control (What it does & Why)
### What it does
Routes are split into:
- **Public pages** (login, password reset).
- **Protected pages** (dashboard, POS, inventory, customers, reports, production, etc.).
- **Role-restricted pages** (admin-only pages like documents).

### How it works
- `PersistLogin` restores session state on reload.
- `RequireAuth` wraps routes and checks user roles.

### Why
Operational features (like POS or inventory editing) must be limited to authorized roles to prevent data loss and enforce accountability.

---

## 4. Inventory / Stock Management (What, How, Why)
### What it does
Inventory management lets staff create, edit, search, export, and delete stock items. It also calculates aggregate stock value and total quantities.

### How it works
- Data is fetched via RTK Query endpoints (`getStock`, `addStock`, `updateStock`, `deleteStock`).
- UI lists stock items with filtering and sorting.
- Exports to CSV/PDF are available for reporting and offline sharing.

### Why
Accurate stock counts prevent overselling, reduce shrinkage, and help with procurement decisions.

---

## 5. POS (Point of Sale) Flow (What, How, Why)
### What it does
POS allows a cashier to search products, add them to a cart, apply discounts/tax, select payment method, record payment, and generate receipts. It also supports holding a sale for later completion.

### How it works
- Products are pulled from stock (`selectStock` selector).
- Cart logic enforces quantity limits against stock.
- Totals (subtotal, discount, tax, total) are computed in memory.
- `makeSales` mutation persists the sale to the backend.
- Receipt UI is shown after completion, with print/PDF download.

### Why
POS is the revenue engine of the system. It needs speed, accuracy, and receipts for audit/compliance.

---

## 6. Sales & Customer Tracking (What, How, Why)
### What it does
Sales records capture customer purchases, payment details, and any dues. Customers can have multiple orders or credit balances.

### How it works
- Sales data is created in POS and stored by the sales API.
- Customer pages aggregate sales and calculate balances (amount paid vs. amount due).

### Why
Tracking dues and payment history ensures proper follow‑up on credit and improves cash‑flow visibility.

---

## 7. Production Section (What, How, Why)
The Production area groups together operational workflows required for manufacturing or order fulfillment.

### 7.1 Employees/Workers
**What:** Manage employees (CRUD), daily lists, and payroll details.
**How:** RTK Query mutations plus searchable tables.
**Why:** Workforce data ties directly to production capacity and costs.

### 7.2 Raw Materials
**What:** Manage raw materials stock, suppliers, and unit costs.
**How:** RTK Query CRUD operations; searchable table with totals.
**Why:** Raw material tracking ensures production doesn’t stall and controls input costs.

### 7.3 Expenses
**What:** Track factory expenses by category, amount, and receiver.
**How:** RTK Query CRUD; searchable table + totals.
**Why:** Expenses are critical for margin analysis and operational auditing.

### 7.4 Orders
**What:** Track customer orders (default product orders and custom orders), quantities produced, progress, and payment status.
**How:** Orders are enriched with customer/product names, displayed with progress bars, and editable in a modal.
**Why:** This provides production planning, work‑in‑progress tracking, and fulfillment accountability.

### 7.5 Production Flow (optional visualization)
**What:** A visual workflow map of production stages.
**How:** React‑Flow diagram with editable stage notes.
**Why:** Helps operations document and communicate how work progresses across stages.

---

## 8. Reports & Analytics (What, How, Why)
### What it does
Reports summarize stock, sales, orders, expenses, and other metrics for decision‑making. Dashboards display KPIs and charts.

### How it works
- Data from multiple slices (stock, sales, expenses, orders, customers) is aggregated.
- Charts show comparisons like stock vs. sales.

### Why
Business owners need quick insight into inventory health, revenue performance, and operational bottlenecks.

---

## 9. Documents & Receipts (What, How, Why)
### What it does
Document workflows include invoices and receipts. Receipts can be previewed, printed, and downloaded as PDFs.

### How it works
- Receipt components build HTML previews and use jsPDF for PDF creation.
- Invoice tools aggregate stock and customer data for billing.

### Why
Formal documents support accounting, compliance, and customer trust.

---

## 10. Real‑Time Updates (What, How, Why)
### What it does
Updates to stock and related data can be pushed to clients via Pusher channels.

### How it works
- A Pusher middleware listens for stock events and invalidates RTK Query tags.

### Why
Real‑time accuracy prevents stale data in fast‑moving environments (e.g., sales counters and warehouses).

---

## 11. Settings & Configuration (What, How, Why)
### What it does
Settings (currency, theme, tax rate) drive consistent display and calculations across POS and inventory.

### How it works
Settings are provided through a shared `Settings` context and consumed by pages like POS and inventory.

### Why
Centralized settings reduce mistakes and keep outputs consistent across the app.

---

## 12. How to Run (Developer Quick Start)
- `npm install`
- `npm start`
- Navigate to `http://localhost:3000`

---

## 13. Summary (Why this design works)
- Modular features allow operations, sales, and management to share a single system.
- Role‑based access ensures security and accountability.
- RTK Query + real‑time updates keep data fresh and reliable.
- POS and inventory are tightly linked to prevent overselling and maintain audit trails.

---

## Appendix A: Key Feature Paths (Reference)
- POS: `src/app/Components/pages/GeminiPos.js`
- Inventory: `src/app/Components/pages/InventorySample.js`
- Production hub: `src/app/Components/Production.js`
- Production modules: `src/app/Components/production/*`
- Stock API: `src/app/features/stock/stockSlice.js`
- Sales API: `src/app/features/api/salesSlice.js`
- Receipts: `src/app/Components/receipts/*`

