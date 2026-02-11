# Invoice Baba — Final Reports Implementation Plan

**Date**: February 2026 | **Status**: PLAN (no code changes)
**Scope**: Sales-only invoice generation app for Indian small businesses

---

## 1. Research & Benchmarking

### 1.1 Official GST Forms Analyzed

| Form | Purpose | Due Date | Relevant to Our App |
|------|---------|----------|-------------------|
| **GSTR-1** | Outward supply details (15 tables) | 11th of next month | YES — Tables 4A, 5A, 7, 8, 9B, 12, 13 |
| **GSTR-3B** | Monthly summary return (7 sections) | 20th of next month | PARTIAL — Tables 3.1, 3.2, 5.1 only (no ITC/purchases) |
| **GSTR-9** | Annual return | 31st December | PARTIAL — Outward supplies + HSN summary only |

**Cannot generate** (no purchase/expense data): GSTR-2A/2B, GSTR-3B ITC section, P&L, Balance Sheet, Cashflow.

### 1.2 Competitor Benchmark (Reports Relevant to Invoicing)

| Report Category | Vyapar | myBillBook | Zoho Invoice | **Our Plan** |
|----------------|--------|------------|--------------|-------------|
| **GSTR-1** | ✓ | ✓ | ✓ | ✓ |
| **GSTR-3B** (partial) | ✓ | ✓ | ✓ | ✓ |
| **GSTR-9** (partial) | ✓ | — | ✓ | ✓ |
| **Sale Report** | ✓ | ✓ | ✓ | ✓ (Sales Register) |
| **Sale Summary by HSN** | ✓ | ✓ | ✓ | ✓ |
| **Party Statement** | ✓ | ✓ | ✓ | ✓ (Customer Ledger) |
| **All Parties Report** | ✓ | ✓ | ✓ | ✓ (Customer Summary) |
| **Tax Report** | ✓ | ✓ | ✓ | ✓ (Tax Collected) |
| **Tax Rate Report** | ✓ | ✓ | — | ✓ |
| **Discount Report** | ✓ | — | — | ✓ |
| **Receivables/Aging** | — | — | ✓ | ✓ |
| **Day Book** | ✓ | ✓ | — | ✗ (needs expenses) |
| **P&L / Balance Sheet** | ✓ | ✓ | ✓ | ✗ (needs full accounting) |
| **Stock/Inventory** | ✓ | ✓ | — | ✗ (out of scope) |

### 1.3 Current State in Our App

**Existing** (4 basic reports):
- Invoice Summary — totals by status
- GST Summary — CGST/SGST/IGST breakup by rate
- Document Report — line-by-line listing with filters
- Monthly Trend — 6-month chart data

**Missing**: Everything needed for actual GST filing, CA handoff, and business analysis.

---

## 2. Final Reports List (13 Reports)

Organized by what Indian businesses actually need, benchmarked against Vyapar/myBillBook/Zoho.

### Category A: GST Filing Reports (Monthly)

#### A1. GSTR-3B Summary
- **Purpose**: Summary of outward tax liability — matches GSTR-3B form Tables 3.1, 3.2, 5.1
- **Frequency**: Monthly (also quarterly for QRMP scheme)
- **Sections**:
  - **3.1(a)** Outward taxable supplies → ISSUED/PAID invoices with tax > 0
  - **3.1(b)** Zero-rated supplies → taxRate = 0 but GST enabled (future: exports)
  - **3.1(c)** Nil-rated/exempt → invoices with no GST applied
  - **3.1(e)** Non-GST supplies → business.gstEnabled = false
  - **3.2** Interstate to unregistered → B2C where business state ≠ customer state
  - **5.1** Tax payable → IGST, CGST, SGST totals from taxBreakup
- **Columns per row**: Taxable Value, IGST, CGST, SGST/UTGST, Cess (always 0)
- **Note**: Tables 4 (ITC), 5 (exempt inward), 6 (payment) left blank — sales-only app
- **Export**: PDF, CSV

#### A2. GSTR-1 — B2B Invoices (Table 4A)
- **Purpose**: Invoice-wise details of supplies to registered persons (with GSTIN)
- **Filter**: `customer.gstin IS NOT NULL AND status IN (ISSUED, PAID)`
- **Columns**: GSTIN of Recipient, Receiver Name, Invoice Number, Invoice Date, Invoice Value, Place of Supply (state name), Reverse Charge (Y/N), Applicable % of Tax Rate, Rate, Taxable Value, IGST Amount, CGST Amount, SGST Amount, Cess Amount
- **Export**: CSV (GST portal compatible), PDF

#### A3. GSTR-1 — B2C Large (Table 5A)
- **Purpose**: Interstate supplies to unregistered persons, invoice value > ₹2.5 lakh
- **Note**: 53rd GST Council recommended reducing to ₹1 lakh — make threshold configurable
- **Filter**: `customer.gstin IS NULL AND taxMode = 'IGST' AND total > threshold`
- **Columns**: Place of Supply, Rate, Taxable Value, IGST Amount, Cess Amount
- **Export**: CSV, PDF

#### A4. GSTR-1 — B2C Small (Table 7)
- **Purpose**: Summary of all other B2C supplies (not in B2C Large)
- **Filter**: `customer.gstin IS NULL AND NOT (B2C Large)`
- **Grouped by**: Place of Supply + Tax Rate
- **Split**: 7A (intrastate) + 7B (interstate ≤ threshold)
- **Columns**: Place of Supply, Rate, Taxable Value, IGST, CGST, SGST, Cess
- **Export**: CSV, PDF

#### A5. GSTR-1 — Credit/Debit Notes (Table 9B)
- **Purpose**: Details of credit notes and debit notes issued during the period
- **Filter**: `documentType IN ('credit_note', 'credit_memo')`
- **Columns**: GSTIN of Recipient (if B2B), Receiver Name, Note Number, Note Date, Note Type (C/D), Note Value, Rate, Taxable Value, IGST, CGST, SGST
- **Data gap**: `originalInvoiceId` needed for linking to original invoice
- **Export**: CSV, PDF

#### A6. GSTR-1 — Nil/Exempt Supplies (Table 8)
- **Purpose**: Summary of nil-rated, exempt, and non-GST outward supplies
- **Filter**: `taxMode = 'NONE' OR taxRate = 0 OR taxRate IS NULL`
- **Split by**: Registered (B2B) vs Unregistered (B2C), Interstate vs Intrastate
- **Columns**: Description, Nil Rated, Exempted, Non-GST
- **Export**: CSV, PDF

#### A7. GSTR-1 — HSN Summary (Table 12)
- **Purpose**: HSN-wise summary of outward supplies
- **Mandatory**: B2B tab (Table 12A) is **mandatory from April 2025**. B2C tab (12B) optional for < ₹5 Cr turnover
- **Requires**: `hsnCode` and `uqc` fields on line items (SCHEMA CHANGE)
- **Split**: Tab 12A (B2B) + Tab 12B (B2C)
- **Columns**: HSN Code, Description, UQC, Total Quantity, Total Value, Taxable Value, IGST, CGST, SGST, Cess
- **HSN digits**: 4-digit for turnover ≤ ₹5 Cr, 6-digit for > ₹5 Cr
- **Export**: CSV (GST portal format), PDF

#### A8. GSTR-1 — Document Summary (Table 13)
- **Purpose**: Summary of all documents issued — number ranges, totals, cancellations
- **Grouped by**: Document nature (Invoices, Credit Notes, Debit Notes, Receipt Vouchers, etc.)
- **Columns**: Nature of Document, Sr. No. From, Sr. No. To, Total Number, Cancelled, Net Issued
- **Export**: CSV, PDF

---

### Category B: Business & Sales Reports

#### B1. Sales Register
- **Purpose**: Complete chronological record of all sales. The #1 report CAs ask for.
- **Benchmark**: Vyapar "Sale Report", myBillBook "Sales Report", Zoho "Invoice Details"
- **Frequency**: Any date range (month/quarter/FY)
- **Columns**: Date, Invoice Number, Document Type, Customer Name, Customer GSTIN, Place of Supply, Taxable Value, Tax Rate %, CGST, SGST, IGST, Total Invoice Value, Status
- **Summary footer**: Total count, Total taxable, Total CGST/SGST/IGST, Grand total
- **Export**: CSV, PDF, Print

#### B2. Customer-wise Sales Summary (Party Report)
- **Purpose**: Revenue per customer with outstanding amounts. Matches Vyapar's "All Parties Report" and Zoho's "Sales by Customer"
- **Frequency**: Any date range
- **Columns**: Customer Name, GSTIN, State, Invoice Count, Gross Sales, Discount, Taxable Value, Tax Collected, Total Revenue, Amount Paid, Outstanding
- **Sort**: By total revenue (descending)
- **Export**: CSV, PDF

#### B3. Customer Ledger (Party Statement)
- **Purpose**: All transactions with a specific customer. Matches Vyapar's "Party Statement"
- **Frequency**: Any date range, per customer
- **Header**: Customer name, GSTIN, phone, address, state
- **Columns**: Date, Document Number, Document Type, Amount, Status
- **Footer**: Total invoiced, Total paid, Outstanding balance
- **Export**: CSV, PDF

#### B4. Tax Rate Report
- **Purpose**: Tax collected grouped by rate. Matches Vyapar's "Tax Rate Report"
- **Frequency**: Any date range
- **Columns**: Tax Rate (%), Invoice Count, Taxable Value, CGST Collected, SGST Collected, IGST Collected, Total Tax Collected
- **Summary**: Grand totals for all rates
- **Export**: CSV, PDF

#### B5. Receivables Aging
- **Purpose**: Outstanding invoices grouped by overdue buckets. Matches Zoho's receivable reports
- **Frequency**: On-demand (as of today or specific date)
- **Buckets**: Not Yet Due | 1–30 days | 31–60 days | 61–90 days | 90+ days
- **Filter**: `status = 'ISSUED' AND dueDate IS NOT NULL`
- **Columns**: Customer Name, Invoice Number, Invoice Date, Due Date, Days Overdue, Amount, Bucket
- **Summary**: Count + amount per bucket, grand total
- **Export**: CSV, PDF

---

## 3. Annual / FY Reports

These aggregate the monthly data for financial year (April–March).

#### C1. Annual Sales Summary (FY Report)
- **Purpose**: Complete FY overview for ITR preparation and CA review
- **Period**: Financial year (Apr 1 – Mar 31)
- **Sections**:
  1. **Revenue Summary**: Gross sales, discounts, net sales, GST collected, total invoiced, paid vs outstanding
  2. **Month-wise breakup**: 12 rows with invoice count, gross, discount, net, tax, total
  3. **Document type breakup**: Count + value per document type
  4. **Tax rate breakup**: Count + taxable + tax per rate slab (0%, 5%, 12%, 18%, 28%)
  5. **B2B vs B2C split**: Count + value for registered vs unregistered customers
- **Export**: PDF, CSV

#### C2. GSTR-9 Data Export (Annual Return)
- **Purpose**: Outward supplies data for GSTR-9 annual return (due Dec 31)
- **Sections we can populate** (sales-only):
  - **Table 4**: Outward supplies (4A B2B, 4B B2C, 4C zero-rated)
  - **Table 5**: Amendments (credit notes, cancelled invoices)
  - **Table 9**: Tax payable summary (IGST, CGST, SGST)
  - **Table 17**: HSN summary (requires hsnCode field)
- **Sections left blank**: Tables 6-8 (ITC), Table 10-14 (previous FY amendments)
- **Export**: CSV, PDF

---

## 4. Export for CA Package

**Purpose**: One-click download of everything a CA needs for monthly/quarterly/yearly filing.

**Button**: "Export for CA" with period selector (Month / Quarter / FY)

**Contents of ZIP** (`InvoiceBaba_[BusinessName]_[Period].zip`):
```
├── Sales_Register.csv
├── GSTR1_B2B_Table4A.csv
├── GSTR1_B2CL_Table5A.csv
├── GSTR1_B2CS_Table7.csv
├── GSTR1_CreditNotes_Table9B.csv
├── GSTR1_NilExempt_Table8.csv
├── GSTR1_HSN_Table12.csv
├── GSTR1_DocSummary_Table13.csv
├── GSTR3B_Summary.pdf
├── Tax_Rate_Report.csv
├── Customer_Summary.csv
├── Receivables_Aging.pdf
└── Invoices/
    ├── INV-0001.pdf
    ├── INV-0002.pdf
    └── ...
```

---

## 5. Data Model Changes Required

### 5.1 Schema Migration — Phase 1 (for all non-HSN reports)

Add to `Invoice` model:
```prisma
paidAt            DateTime?   // When payment was received (set when status → PAID)
originalInvoiceId String?     // For credit/debit notes → links to original invoice
reverseCharge     Boolean     @default(false) // Reverse charge flag for GSTR-1

// Self-relation
originalInvoice   Invoice?    @relation("CreditNoteRef", fields: [originalInvoiceId], references: [id])
creditNotes       Invoice[]   @relation("CreditNoteRef")
```

### 5.2 Schema Migration — Phase 2 (for HSN reports)

Add to `InvoiceLineItem`:
```prisma
hsnCode    String?                    // HSN/SAC code (4/6/8 digit)
uqc        String?   @default("NOS") // Unit Quantity Code
```

Add to `ProductService`:
```prisma
hsnCode    String?                    // Default HSN/SAC code
uqc        String?   @default("NOS") // Default UQC
```

### 5.3 Config Files (No Schema Change)

**Indian States** (`shared/config/indianStates.js`):
```javascript
export const INDIAN_STATES = {
  '01': 'Jammu & Kashmir',    '02': 'Himachal Pradesh',
  '03': 'Punjab',             '04': 'Chandigarh',
  '05': 'Uttarakhand',        '06': 'Haryana',
  '07': 'Delhi',              '08': 'Rajasthan',
  '09': 'Uttar Pradesh',      '10': 'Bihar',
  '11': 'Sikkim',             '12': 'Arunachal Pradesh',
  '13': 'Nagaland',           '14': 'Manipur',
  '15': 'Mizoram',            '16': 'Tripura',
  '17': 'Meghalaya',          '18': 'Assam',
  '19': 'West Bengal',        '20': 'Jharkhand',
  '21': 'Odisha',             '22': 'Chhattisgarh',
  '23': 'Madhya Pradesh',     '24': 'Gujarat',
  '26': 'Dadra & Nagar Haveli and Daman & Diu',
  '27': 'Maharashtra',        '29': 'Karnataka',
  '30': 'Goa',                '31': 'Lakshadweep',
  '32': 'Kerala',             '33': 'Tamil Nadu',
  '34': 'Puducherry',         '35': 'Andaman & Nicobar Islands',
  '36': 'Telangana',          '37': 'Andhra Pradesh',
  '38': 'Ladakh',             '97': 'Other Territory',
  '96': 'Foreign Country',
}
```

**UQC Codes** (`shared/config/uqcCodes.js`):
```javascript
export const UQC_CODES = [
  { code: 'BAG', label: 'Bags' },
  { code: 'BAL', label: 'Bales' },
  { code: 'BDL', label: 'Bundles' },
  { code: 'BKL', label: 'Buckles' },
  { code: 'BOU', label: 'Billions of Units' },
  { code: 'BOX', label: 'Box' },
  { code: 'BTL', label: 'Bottles' },
  { code: 'BUN', label: 'Bunches' },
  { code: 'CAN', label: 'Cans' },
  { code: 'CBM', label: 'Cubic Metres' },
  { code: 'CCM', label: 'Cubic Centimetres' },
  { code: 'CMS', label: 'Centimetres' },
  { code: 'CTN', label: 'Cartons' },
  { code: 'DOZ', label: 'Dozens' },
  { code: 'DRM', label: 'Drums' },
  { code: 'GGK', label: 'Great Gross' },
  { code: 'GMS', label: 'Grams' },
  { code: 'GRS', label: 'Gross' },
  { code: 'GYD', label: 'Gross Yards' },
  { code: 'HRS', label: 'Hours' },
  { code: 'KGS', label: 'Kilograms' },
  { code: 'KLR', label: 'Kilolitres' },
  { code: 'KME', label: 'Kilometres' },
  { code: 'LTR', label: 'Litres' },
  { code: 'MTR', label: 'Metres' },
  { code: 'MTS', label: 'Metric Tonnes' },
  { code: 'NOS', label: 'Numbers' },
  { code: 'OTH', label: 'Others' },
  { code: 'PAC', label: 'Packs' },
  { code: 'PCS', label: 'Pieces' },
  { code: 'PRS', label: 'Pairs' },
  { code: 'QTL', label: 'Quintals' },
  { code: 'ROL', label: 'Rolls' },
  { code: 'SET', label: 'Sets' },
  { code: 'SQF', label: 'Square Feet' },
  { code: 'SQM', label: 'Square Metres' },
  { code: 'SQY', label: 'Square Yards' },
  { code: 'TBS', label: 'Tablets' },
  { code: 'TGM', label: 'Ten Gross' },
  { code: 'THD', label: 'Thousands' },
  { code: 'TON', label: 'Tonnes' },
  { code: 'TUB', label: 'Tubes' },
  { code: 'UGS', label: 'US Gallons' },
  { code: 'UNT', label: 'Units' },
  { code: 'YDS', label: 'Yards' },
]
```

---

## 6. Supply Type Classification (Derived — No New Fields)

```javascript
function classifySupply(invoice, customer, business) {
  const hasGSTIN = !!customer?.gstin
  const isInterstate = business.stateCode !== invoice.placeOfSupplyStateCode
  const threshold = 250000 // configurable — may reduce to 100000

  if (hasGSTIN) return 'B2B'                                    // Table 4A
  if (isInterstate && parseFloat(invoice.total) > threshold)
    return 'B2C_LARGE'                                          // Table 5A
  return 'B2C_SMALL'                                            // Table 7
}
```

---

## 7. API Endpoints (New)

All under `GET /reports/...` with `authenticate` middleware.

```
# ── GST Filing Reports ──────────────────────────────────
GET /reports/gstr3b?month=YYYY-MM
GET /reports/gstr1/b2b?month=YYYY-MM
GET /reports/gstr1/b2c-large?month=YYYY-MM
GET /reports/gstr1/b2c-small?month=YYYY-MM
GET /reports/gstr1/credit-notes?month=YYYY-MM
GET /reports/gstr1/nil-exempt?month=YYYY-MM
GET /reports/gstr1/hsn?month=YYYY-MM
GET /reports/gstr1/doc-summary?month=YYYY-MM

# ── Business Reports ────────────────────────────────────
GET /reports/sales-register?dateFrom=&dateTo=
GET /reports/customer-summary?dateFrom=&dateTo=
GET /reports/customer-ledger/:customerId?dateFrom=&dateTo=
GET /reports/tax-rate-report?dateFrom=&dateTo=
GET /reports/receivables?asOfDate=YYYY-MM-DD

# ── Annual / FY ─────────────────────────────────────────
GET /reports/annual-summary?fy=2025-26
GET /reports/gstr9?fy=2025-26

# ── Export ───────────────────────────────────────────────
GET /reports/ca-package?month=YYYY-MM        (returns ZIP)
GET /reports/ca-package?fy=2025-26           (returns ZIP)
```

---

## 8. Frontend UI Plan

### 8.1 Reports Page — Tab Structure

```
Reports
├── [Tab] Sales Register       ← B1: Complete sales log
├── [Tab] GST Returns          ← A1–A8: GSTR-1 + GSTR-3B
├── [Tab] Customers            ← B2 + B3: Party summary + ledger
├── [Tab] Tax & Receivables    ← B4 + B5: Tax rate report + aging
└── [Tab] Annual / FY          ← C1 + C2: FY summary + GSTR-9
```

### 8.2 GST Returns Tab Layout

```
┌─────────────────────────────────────────────────┐
│  Period: [Month ▾] [Year ▾]  [Generate Report]  │
├─────────────────────────────────────────────────┤
│                                                  │
│  ┌── GSTR-3B Summary ──────────────────────┐    │
│  │  3.1 Outward Supplies (card with table)  │    │
│  │  3.2 Interstate to Unregistered          │    │
│  │  5.1 Tax Payable                         │    │
│  │                        [Export PDF] [CSV] │    │
│  └──────────────────────────────────────────┘    │
│                                                  │
│  ┌── GSTR-1 Sections ──────────────────────┐    │
│  │  ▸ Table 4A: B2B Invoices (12)   [CSV]  │    │
│  │  ▸ Table 5A: B2C Large (2)       [CSV]  │    │
│  │  ▸ Table 7:  B2C Small (45)      [CSV]  │    │
│  │  ▸ Table 8:  Nil/Exempt (3)      [CSV]  │    │
│  │  ▸ Table 9B: Credit Notes (1)    [CSV]  │    │
│  │  ▸ Table 12: HSN Summary (8)     [CSV]  │    │
│  │  ▸ Table 13: Doc Summary         [CSV]  │    │
│  └──────────────────────────────────────────┘    │
│                                                  │
│  [Download All CSVs as ZIP] [Export for CA]       │
└─────────────────────────────────────────────────┘
```

Each GSTR-1 section is an expandable/collapsible card showing a data table when expanded.

### 8.3 Export Formats

| Report | CSV | PDF | Print |
|--------|-----|-----|-------|
| GSTR-3B Summary | ✓ | ✓ | ✓ |
| GSTR-1 Tables (all) | ✓ | ✓ | ✓ |
| Sales Register | ✓ | ✓ | ✓ |
| Customer Summary | ✓ | ✓ | ✓ |
| Customer Ledger | ✓ | ✓ | ✓ |
| Tax Rate Report | ✓ | ✓ | ✓ |
| Receivables Aging | ✓ | ✓ | ✓ |
| Annual Summary | ✓ | ✓ | ✓ |
| GSTR-9 Data | ✓ | ✓ | ✓ |
| CA Package | — | — | — | ZIP containing all above |

---

## 9. Implementation Plan (4 Phases)

### Phase R1: Sales Register + GSTR-3B + B2B (Core) — ~4 days

**Schema**: Add `paidAt` to Invoice + migration. Auto-set when status → PAID.

**Backend** (3 new service functions + handlers + routes):
1. `GET /reports/gstr3b` — Aggregate invoices into 3.1/3.2/5.1 sections
2. `GET /reports/gstr1/b2b` — B2B invoices with GST portal columns
3. `GET /reports/sales-register` — Chronological invoice list with tax breakup

**Frontend**:
4. Create `indianStates.js` config (state code → name mapping)
5. Refactor ReportsPage into tabbed layout (Sales Register + GST Returns tabs)
6. Sales Register tab — table with date range filter, CSV/PDF/Print export
7. GST Returns tab — period selector + GSTR-3B summary card + B2B section

**Exports**: Reuse existing CSV/Print helpers, extend for new column sets.

### Phase R2: Complete GSTR-1 + Customer Reports — ~4 days

**Schema**: Add `originalInvoiceId`, `reverseCharge` to Invoice + migration.

**Backend** (6 endpoints):
1. `GET /reports/gstr1/b2c-large` — Interstate B2C > ₹2.5L
2. `GET /reports/gstr1/b2c-small` — Grouped B2C summary
3. `GET /reports/gstr1/nil-exempt` — Nil/exempt supplies
4. `GET /reports/gstr1/credit-notes` — Credit/debit notes
5. `GET /reports/gstr1/doc-summary` — Document number ranges
6. `GET /reports/customer-summary` — Customer-wise revenue

**Frontend**:
7. Complete all GSTR-1 collapsible sections in GST Returns tab
8. Customers tab — summary table + drill-down to customer ledger
9. Per-section CSV export buttons

### Phase R3: Tax, Receivables, Annual Reports — ~3 days

**Backend** (5 endpoints):
1. `GET /reports/tax-rate-report` — Tax by rate slab
2. `GET /reports/receivables` — Aging buckets
3. `GET /reports/customer-ledger/:id` — Per-customer transactions
4. `GET /reports/annual-summary` — FY consolidated data
5. `GET /reports/gstr9` — GSTR-9 outward supply sections

**Frontend**:
6. Tax & Receivables tab — tax rate table + aging report
7. Annual / FY tab — FY selector + summary cards + month-wise table
8. GSTR-9 data view within Annual tab

### Phase R4: HSN Support + CA Package — ~4 days

**Schema**: Add `hsnCode`, `uqc` to InvoiceLineItem and ProductService + migration.

**Config**: Create `uqcCodes.js`.

**Backend**:
1. `GET /reports/gstr1/hsn` — HSN summary (Table 12A/12B)
2. `GET /reports/ca-package` — Generate ZIP with all reports + invoice PDFs

**Frontend**:
3. HSN/UQC fields in Product form and invoice line items (auto-fill from product)
4. HSN Summary section in GST Returns tab
5. "Export for CA" button with period selector → downloads ZIP
6. HSN search/dropdown (optional: integrate HSN code database)

---

## 10. What We Explicitly Do NOT Build (Out of Scope)

| Feature | Reason |
|---------|--------|
| P&L Statement | Needs expense/purchase tracking |
| Balance Sheet | Needs full double-entry accounting |
| GSTR-2A/2B Reconciliation | Needs purchase invoice data |
| GSTR-3B ITC Section (Table 4) | No purchase data |
| Cashflow Report | No expense tracking |
| Stock/Inventory Reports | No inventory management |
| Day Book | Needs all transaction types |
| E-invoice (IRN) Generation | Separate integration with NIC portal — future |
| E-way Bill Generation | Separate integration — future |
| Bill-wise Profit | Needs cost/purchase price per item |

---

## 11. Summary

| Metric | Value |
|--------|-------|
| **Total new reports** | 13 (currently 4) |
| **New API endpoints** | ~16 |
| **Schema migrations** | 2 (Phase R1 + R4) |
| **New config files** | 2 (indianStates, uqcCodes) |
| **Frontend tabs** | 5 (replacing single page) |
| **Implementation phases** | 4 (~15 days total) |
| **GST forms covered** | GSTR-1 (7 tables), GSTR-3B (partial), GSTR-9 (partial) |
| **Competitor parity** | Matches Vyapar/myBillBook/Zoho for invoicing-scope reports |

**Key differentiator**: "Export for CA" one-click ZIP — no competitor offers this as cleanly for invoice-only apps.

---

**End of Plan**
