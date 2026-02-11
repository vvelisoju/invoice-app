# Invoice Baba — Comprehensive Reports Plan for India GST & IT Compliance

**Date**: February 2026  
**Status**: PLAN (no code changes)  
**Scope**: Sales-side invoicing app for Indian small businesses

---

## 1. Current State Analysis

### 1.1 Existing Reports

| Report | API Endpoint | What It Does |
|--------|-------------|--------------|
| Invoice Summary | `GET /reports/summary` | Total invoices, subtotal, discount, tax, total — grouped by status, filterable by date range |
| GST Summary | `GET /reports/gst` | Total taxable value, CGST/SGST/IGST breakup, grouped by tax rate |
| Document Report | `GET /reports/documents` | Line-by-line listing of all documents with customer info, filterable by date/status/docType |
| Monthly Trend | `GET /reports/trend` | Last N months invoice count + amounts + paid amounts |

**Current Export Options**: CSV, Summary PDF (print-to-PDF), Print, ZIP of individual invoice PDFs.

### 1.2 Data Model Gaps

Fields **currently missing** from the schema that are needed for full GST compliance:

| Missing Field | Where | Why Needed |
|---------------|-------|------------|
| **HSN/SAC Code** | `InvoiceLineItem` + `ProductService` | Mandatory for GSTR-1 HSN summary (Table 12), required on tax invoices for businesses > ₹5 Cr turnover |
| **Unit Quantity Code (UQC)** | `InvoiceLineItem` + `ProductService` | GSTR-1 HSN summary requires standard UQC codes (NOS, KGS, MTR, etc.) |
| **Item-level tax rate** | `InvoiceLineItem` | Future: mixed GST rates per line item (current: invoice-level only) |
| **Reverse Charge flag** | `Invoice` | GSTR-1 Section 4A/4B requires identifying reverse charge supplies |
| **Payment date** | `Invoice` (e.g., `paidAt`) | Receivable aging, cash flow reports, TDS reconciliation |
| **Credit/Debit Note reference** | `Invoice` (e.g., `originalInvoiceId`) | GSTR-1 Section 9B — credit notes must reference the original invoice |
| **E-way Bill Number** | `Invoice` (optional) | Required for goods transport > ₹50,000 |
| **Export type / Port code** | `Invoice` (optional) | GSTR-1 Section 6A — export invoices with/without payment |
| **Supply type enum** | Derived (not stored) | B2B / B2C Large / B2C Small / Export / SEZ — derivable from GSTIN + amount + state |

**Fields that ARE available** and sufficient for most reports:
- Customer GSTIN, state code, name, address
- Business GSTIN, state code
- Invoice-level tax mode (IGST / CGST_SGST / NONE), tax rate, tax breakup JSON
- Place of supply state code
- Invoice date, status, amounts, document type
- Line items with name, qty, rate, total

---

## 2. India GST Filing Calendar & Required Reports

### 2.1 Monthly Reports

#### REPORT M1: GSTR-3B Summary (Due: 20th of next month)

**Purpose**: Summary return filed monthly. Shows total outward supplies and tax liability.  
**Who files**: All GST-registered businesses (regular scheme).  
**Frequency**: Monthly (or quarterly for businesses < ₹5 Cr under QRMP scheme).

**Data Required** (for outward supplies section only — this is a sales app):

| Section | Description | Source |
|---------|-------------|--------|
| **3.1(a)** | Outward taxable supplies (other than zero-rated, nil-rated, exempted) | All ISSUED/PAID invoices with tax > 0 |
| **3.1(b)** | Outward taxable supplies (zero-rated) | Invoices with taxRate = 0 but GST enabled |
| **3.1(c)** | Other outward supplies (nil-rated, exempted) | Invoices with no GST |
| **3.1(d)** | Inward supplies (reverse charge) | Not applicable (sales-only app) |
| **3.1(e)** | Non-GST outward supplies | Invoices where gstEnabled = false |
| **3.2** | Interstate supplies to unregistered persons | B2C invoices where business state ≠ customer state |
| **5.1** | Tax payable — IGST, CGST, SGST, Cess | Sum from taxBreakup JSON |

**Report Format**:
```
Period: [Month/Year]
Business: [Name] | GSTIN: [Number]
─────────────────────────────────────────────────────
3.1 Outward Supplies & Tax Liability
─────────────────────────────────────────────────────
(a) Outward taxable supplies
    Taxable Value:     ₹ XX,XX,XXX
    IGST:              ₹ X,XX,XXX
    CGST:              ₹ X,XX,XXX
    SGST:              ₹ X,XX,XXX
    
(b) Zero-rated supplies
    Taxable Value:     ₹ XX,XXX
    
(c) Nil-rated / Exempted
    Taxable Value:     ₹ XX,XXX
    
(e) Non-GST supplies
    Taxable Value:     ₹ XX,XXX

3.2 Interstate supplies to unregistered persons
    Total Value:       ₹ XX,XXX
    
5.1 Tax Payable
    IGST:              ₹ X,XX,XXX
    CGST:              ₹ X,XX,XXX  
    SGST:              ₹ X,XX,XXX
─────────────────────────────────────────────────────
```

**Export**: PDF summary + JSON (for direct GST portal upload if needed).

---

#### REPORT M2: GSTR-1 Data — B2B Invoices (Due: 11th of next month)

**Purpose**: Details of outward supplies to registered businesses (those with GSTIN).  
**Section**: Table 4A of GSTR-1.

**Filter Logic**: `customer.gstin IS NOT NULL AND invoice.status IN (ISSUED, PAID)`

**Columns**:
| # | Column | Source |
|---|--------|--------|
| 1 | GSTIN of Recipient | `customer.gstin` |
| 2 | Receiver Name | `customer.name` |
| 3 | Invoice Number | `invoice.invoiceNumber` |
| 4 | Invoice Date | `invoice.date` |
| 5 | Invoice Value | `invoice.total` |
| 6 | Place of Supply | `invoice.placeOfSupplyStateCode` → State name |
| 7 | Reverse Charge | "N" (default; flag needed in future) |
| 8 | Invoice Type | "Regular" (default) |
| 9 | Rate | `invoice.taxRate` |
| 10 | Taxable Value | `invoice.subtotal - invoice.discountTotal` |
| 11 | IGST Amount | `taxBreakup.igstAmount` or 0 |
| 12 | CGST Amount | `taxBreakup.cgstAmount` or 0 |
| 13 | SGST Amount | `taxBreakup.sgstAmount` or 0 |
| 14 | Cess Amount | 0 (not supported in V1) |

**Export**: CSV (GST portal compatible format), Excel, PDF.

---

#### REPORT M3: GSTR-1 Data — B2C Large (Interstate > ₹2.5 Lakh)

**Purpose**: Details of interstate supplies to unregistered persons where invoice value > ₹2,50,000.  
**Section**: Table 5A of GSTR-1.

**Filter Logic**: `customer.gstin IS NULL AND taxMode = 'IGST' AND invoice.total > 250000`

**Columns**:
| # | Column | Source |
|---|--------|--------|
| 1 | Place of Supply | State name from `placeOfSupplyStateCode` |
| 2 | Rate | `invoice.taxRate` |
| 3 | Taxable Value | `subtotal - discountTotal` |
| 4 | IGST Amount | `taxBreakup.igstAmount` |
| 5 | Cess Amount | 0 |
| 6 | E-Commerce GSTIN | N/A |

**Export**: CSV, Excel, PDF.

---

#### REPORT M4: GSTR-1 Data — B2C Small (All other B2C)

**Purpose**: Summary of supplies to unregistered persons (B2C) not covered in B2C Large.  
**Section**: Table 7 of GSTR-1.

**Filter Logic**: `customer.gstin IS NULL AND NOT (taxMode = 'IGST' AND total > 250000)`

**Grouped By**: Place of Supply (state) + Tax Rate

**Columns**:
| # | Column | Source |
|---|--------|--------|
| 1 | Place of Supply | State name |
| 2 | Rate | Tax rate |
| 3 | Taxable Value | Sum of (subtotal - discount) |
| 4 | IGST Amount | Sum (if interstate) |
| 5 | CGST Amount | Sum (if intrastate) |
| 6 | SGST Amount | Sum (if intrastate) |
| 7 | Cess Amount | 0 |

**Export**: CSV, Excel, PDF.

---

#### REPORT M5: GSTR-1 Data — Credit/Debit Notes

**Purpose**: Details of credit notes and debit notes issued.  
**Section**: Table 9B of GSTR-1.

**Filter Logic**: `documentType IN ('credit_note', 'credit_memo')`

**Columns**:
| # | Column | Source |
|---|--------|--------|
| 1 | GSTIN of Recipient | `customer.gstin` (if B2B) |
| 2 | Receiver Name | `customer.name` |
| 3 | Note Number | `invoiceNumber` |
| 4 | Note Date | `date` |
| 5 | Note Type | "C" for credit, "D" for debit |
| 6 | Original Invoice Number | Needs `originalInvoiceId` field (DATA GAP) |
| 7 | Original Invoice Date | From referenced invoice |
| 8 | Note Value | `total` |
| 9 | Rate | `taxRate` |
| 10 | Taxable Value | `subtotal - discountTotal` |
| 11 | IGST / CGST / SGST | From `taxBreakup` |

**Export**: CSV, Excel, PDF.

---

#### REPORT M6: GSTR-1 — Document Summary

**Purpose**: Summary of documents issued during the period — invoice number ranges, total issued, cancelled, net issued.  
**Section**: Table 13 of GSTR-1.

**Grouped By**: Document type (Invoice, Credit Note, Debit Note, Receipt Voucher, etc.)

**Columns**:
| # | Column | Source |
|---|--------|--------|
| 1 | Nature of Document | Document type |
| 2 | Sr. No. From | MIN invoiceNumber in period |
| 3 | Sr. No. To | MAX invoiceNumber in period |
| 4 | Total Number | Count of documents |
| 5 | Cancelled | Count with status = CANCELLED or VOID |
| 6 | Net Issued | Total - Cancelled |

**Export**: CSV, PDF.

---

#### REPORT M7: Sales Register (Monthly)

**Purpose**: Complete record of all sales for the month. Used by CAs for bookkeeping and ITR preparation.  
**Frequency**: Monthly (also available quarterly/yearly).

**Columns**:
| # | Column | Source |
|---|--------|--------|
| 1 | Date | `invoice.date` |
| 2 | Invoice Number | `invoiceNumber` |
| 3 | Document Type | `documentType` label |
| 4 | Customer Name | `customer.name` |
| 5 | Customer GSTIN | `customer.gstin` |
| 6 | Place of Supply | State name |
| 7 | HSN/SAC | Line items HSN (needs field) |
| 8 | Taxable Value | `subtotal - discountTotal` |
| 9 | Tax Rate | `taxRate` % |
| 10 | CGST | `taxBreakup.cgstAmount` |
| 11 | SGST | `taxBreakup.sgstAmount` |
| 12 | IGST | `taxBreakup.igstAmount` |
| 13 | Total | `total` |
| 14 | Status | ISSUED / PAID / CANCELLED |
| 15 | Payment Date | `paidAt` (needs field) |

**Export**: CSV (Excel-compatible), PDF, Print.

---

#### REPORT M8: Receivables Aging Report

**Purpose**: Outstanding invoices grouped by age buckets. Critical for cash flow management and follow-up.  
**Frequency**: On-demand (default: as of today).

**Age Buckets**: Current (not due) | 1–30 days | 31–60 days | 61–90 days | 90+ days overdue

**Filter Logic**: `status IN ('ISSUED') AND dueDate IS NOT NULL`  
(Invoices that are issued but not yet paid)

**Columns**:
| # | Column | Source |
|---|--------|--------|
| 1 | Customer Name | `customer.name` |
| 2 | Invoice Number | `invoiceNumber` |
| 3 | Invoice Date | `date` |
| 4 | Due Date | `dueDate` |
| 5 | Days Overdue | `today - dueDate` |
| 6 | Invoice Amount | `total` |
| 7 | Age Bucket | Derived from days overdue |

**Summary Section**:
```
Age Bucket        Count    Amount
──────────────────────────────────
Not Yet Due         5     ₹1,50,000
1–30 Days           3     ₹  75,000
31–60 Days          2     ₹  40,000
61–90 Days          1     ₹  25,000
90+ Days            1     ₹  10,000
──────────────────────────────────
TOTAL              12     ₹3,00,000
```

**Export**: CSV, PDF, Print.

---

### 2.2 Quarterly Reports

#### REPORT Q1: Quarterly GST Summary

**Purpose**: Consolidated GSTR-3B style summary for the quarter. Required for QRMP scheme businesses (turnover < ₹5 Cr) who file quarterly.  
**Quarters**: Q1 (Apr–Jun), Q2 (Jul–Sep), Q3 (Oct–Dec), Q4 (Jan–Mar)

**Format**: Same as Report M1 (GSTR-3B Summary) but for 3-month period.

**Additional Quarterly Totals**:
- Month-wise breakup within the quarter
- Quarter-over-quarter comparison (vs. previous quarter)

---

#### REPORT Q2: Customer-wise Sales Summary (Quarterly)

**Purpose**: Revenue per customer for the quarter. Useful for TDS reconciliation under Section 194Q (buyer deducting TDS on purchases > ₹50L) and for business analysis.

**Columns**:
| # | Column | Source |
|---|--------|--------|
| 1 | Customer Name | `customer.name` |
| 2 | GSTIN | `customer.gstin` |
| 3 | Phone | `customer.phone` |
| 4 | State | `customer.stateCode` → name |
| 5 | Invoice Count | Count of invoices |
| 6 | Taxable Value | Sum of (subtotal - discount) |
| 7 | Tax Collected | Sum of taxTotal |
| 8 | Total Revenue | Sum of total |
| 9 | Paid Amount | Sum of PAID invoices total |
| 10 | Outstanding | Total Revenue - Paid Amount |

**Export**: CSV, PDF.

---

### 2.3 Annual Reports

#### REPORT A1: GSTR-9 Annual Return Data

**Purpose**: Comprehensive annual GST data export. GSTR-9 is the annual return due by 31st December for the previous financial year (April–March).  
**Applicability**: Mandatory for all regular GST taxpayers.

**Sections required**:

**Part II — Details of Outward Supplies (Tables 4–5)**:
| Row | Description | Source |
|-----|-------------|--------|
| 4A | Supplies to registered persons (B2B) | GSTIN not null |
| 4B | Supplies to unregistered persons (B2C) | GSTIN is null |
| 4C | Zero-rated supplies (exports) | Tax rate = 0 with GST enabled |
| 4D | Supplies under reverse charge | Needs RCM flag |
| 5A-5H | Amendments to above | Credit notes, cancelled invoices |

For each row: **Taxable Value, CGST, SGST, IGST, Cess**

**Part III — Details of ITC**: Not applicable (sales-only app — would need purchase data).

**Part IV — Tax Paid (Table 9)**:
- Total tax payable: IGST, CGST, SGST
- Tax paid (through cash/ITC) — limited view from sales side

**Part V — Transactions for Previous FY (Table 10–14)**:
- Amendments to previous year invoices
- Late issued credit/debit notes

**Part VI — HSN-wise Summary (Table 17)**:
| # | Column | Source |
|---|--------|--------|
| 1 | HSN/SAC Code | Needs `hsnCode` field on line items |
| 2 | UQC | Needs `uqc` field (NOS, KGS, etc.) |
| 3 | Total Quantity | Sum of quantities |
| 4 | Total Value | Sum of line totals |
| 5 | Taxable Value | Sum of taxable amounts |
| 6 | IGST | Sum |
| 7 | CGST | Sum |
| 8 | SGST | Sum |

**Export**: JSON (GST portal format), CSV, PDF.

---

#### REPORT A2: Annual Sales Summary (Financial Year)

**Purpose**: Complete financial year sales overview for Income Tax filing (ITR) and CA review.  
**Period**: April 1 – March 31.

**Sections**:

**1. Revenue Summary**:
```
Financial Year: [FY 2025-26]
─────────────────────────────────────────
Total Sales (Gross):          ₹ XX,XX,XXX
Less: Discounts:              ₹    X,XXX
Net Sales:                    ₹ XX,XX,XXX
GST Collected:                ₹  X,XX,XXX
Total Invoiced Value:         ₹ XX,XX,XXX
─────────────────────────────────────────
Paid:                         ₹ XX,XX,XXX
Outstanding:                  ₹  X,XX,XXX
Written Off (Cancelled/Void): ₹    X,XXX
```

**2. Month-wise Breakup** (12 months):
| Month | Invoice Count | Gross Sales | Discount | Net Sales | GST | Total |
|-------|--------------|-------------|----------|-----------|-----|-------|

**3. Document Type Breakup**:
| Document Type | Count | Total Value |
|---------------|-------|-------------|

**4. Tax Rate Breakup**:
| Tax Rate | Invoices | Taxable Value | Tax Amount |
|----------|----------|---------------|------------|
| 0% | xx | ₹xx | ₹0 |
| 5% | xx | ₹xx | ₹xx |
| 12% | xx | ₹xx | ₹xx |
| 18% | xx | ₹xx | ₹xx |
| 28% | xx | ₹xx | ₹xx |

**Export**: PDF, CSV, Print.

---

#### REPORT A3: Customer Ledger (Annual)

**Purpose**: Complete transaction history per customer for the financial year. CAs need this for ITR preparation and TDS verification.

**For each customer**:
```
Customer: [Name]
GSTIN: [Number]
State: [State]
─────────────────────────────────────────
Date       | Doc #    | Type    | Amount  | Status
01/04/2025 | INV-0042 | Invoice | ₹15,000 | Paid
15/04/2025 | INV-0048 | Invoice | ₹8,500  | Issued
...
─────────────────────────────────────────
Total Invoiced:    ₹23,500
Total Paid:        ₹15,000
Outstanding:       ₹ 8,500
```

**Export**: PDF (per customer or all), CSV.

---

#### REPORT A4: HSN/SAC Summary (Annual)

**Purpose**: HSN-wise summary of all goods/services sold. Required for GSTR-9 Table 17 and for businesses with turnover > ₹5 Cr (mandatory 6-digit HSN on invoices).

**Note**: This report requires the HSN/SAC code field to be added to the data model (see Section 4).

**Columns**: Same as GSTR-9 Part VI — Table 17 above.

**Export**: CSV (GST portal format), PDF.

---

### 2.4 On-Demand / Utility Reports

#### REPORT U1: Tax Payment Calculator

**Purpose**: Quick view of GST liability for a given period minus any credit notes — to know how much to pay via GST portal.

```
Period: [Month/Year]
─────────────────────────────────────────
Outward Tax Liability:
  IGST:           ₹ X,XX,XXX
  CGST:           ₹ X,XX,XXX
  SGST:           ₹ X,XX,XXX
  
Less: Credit Notes:
  IGST:           ₹   -X,XXX
  CGST:           ₹   -X,XXX
  SGST:           ₹   -X,XXX
  
Net Tax Payable:
  IGST:           ₹ X,XX,XXX
  CGST:           ₹ X,XX,XXX
  SGST:           ₹ X,XX,XXX
  TOTAL:          ₹ X,XX,XXX
─────────────────────────────────────────
```

---

#### REPORT U2: Top Customers Report

**Purpose**: Revenue ranking of customers for any period.

**Columns**: Rank, Customer Name, GSTIN, Invoice Count, Total Revenue, % of Total Sales.

---

#### REPORT U3: Invoice Status Summary

**Purpose**: Quick snapshot of all invoice statuses for follow-up.

| Status | Count | Amount | % |
|--------|-------|--------|---|
| Paid | xxx | ₹xx | xx% |
| Issued (Unpaid) | xxx | ₹xx | xx% |
| Overdue | xxx | ₹xx | xx% |
| Draft | xxx | ₹xx | xx% |
| Cancelled/Void | xxx | ₹xx | xx% |

---

## 3. Reports Summary Matrix

| # | Report Name | Frequency | GST Filing | IT Filing | Priority |
|---|-------------|-----------|------------|-----------|----------|
| **M1** | GSTR-3B Summary | Monthly | GSTR-3B (20th) | — | **P0** |
| **M2** | GSTR-1 B2B Invoices | Monthly | GSTR-1 Table 4A (11th) | — | **P0** |
| **M3** | GSTR-1 B2C Large | Monthly | GSTR-1 Table 5A | — | **P1** |
| **M4** | GSTR-1 B2C Small | Monthly | GSTR-1 Table 7 | — | **P1** |
| **M5** | GSTR-1 Credit/Debit Notes | Monthly | GSTR-1 Table 9B | — | **P1** |
| **M6** | GSTR-1 Document Summary | Monthly | GSTR-1 Table 13 | — | **P1** |
| **M7** | Sales Register | Monthly | Reference | ITR prep | **P0** |
| **M8** | Receivables Aging | On-demand | — | — | **P1** |
| **Q1** | Quarterly GST Summary | Quarterly | QRMP scheme | — | **P1** |
| **Q2** | Customer-wise Sales | Quarterly | — | TDS reconciliation | **P2** |
| **A1** | GSTR-9 Annual Return Data | Annual | GSTR-9 (Dec 31) | — | **P1** |
| **A2** | Annual Sales Summary | Annual | — | ITR (Revenue) | **P0** |
| **A3** | Customer Ledger | Annual | — | ITR / TDS | **P2** |
| **A4** | HSN Summary | Annual | GSTR-9 Table 17 | — | **P2** (needs schema change) |
| **U1** | Tax Payment Calculator | On-demand | Payment reference | — | **P1** |
| **U2** | Top Customers | On-demand | — | Business analysis | **P2** |
| **U3** | Invoice Status Summary | On-demand | — | — | **P2** |

---

## 4. Required Schema Changes (Prerequisites)

### 4.1 Priority 1 — Needed for P0/P1 Reports

```prisma
// Add to Invoice model
model Invoice {
  // ... existing fields ...
  paidAt          DateTime?        // When payment was received
  originalInvoiceId String?        // For credit/debit notes — reference to original
  reverseCharge   Boolean @default(false) // Reverse charge mechanism flag
  
  // Self-relation for credit note → original invoice
  originalInvoice Invoice? @relation("CreditNoteRef", fields: [originalInvoiceId], references: [id])
  creditNotes     Invoice[] @relation("CreditNoteRef")
}
```

### 4.2 Priority 2 — Needed for HSN Reports (GSTR-9, Compliance)

```prisma
// Add to InvoiceLineItem model  
model InvoiceLineItem {
  // ... existing fields ...
  hsnCode    String?   // HSN/SAC code (4/6/8 digit)
  uqc        String?   // Unit Quantity Code: NOS, KGS, MTR, LTR, etc.
  taxRate    Decimal?  @db.Decimal(5, 2)  // Item-level tax rate (future)
}

// Add to ProductService model
model ProductService {
  // ... existing fields ...
  hsnCode    String?   // Default HSN/SAC code
  uqc        String?   // Default Unit Quantity Code
}
```

### 4.3 State Code to Name Mapping (Config — No Schema Change)

Create a static config file `app/src/config/indianStates.js`:

```javascript
// 2-digit state codes per GST specification
export const INDIAN_STATES = {
  '01': { name: 'Jammu & Kashmir', code: 'JK' },
  '02': { name: 'Himachal Pradesh', code: 'HP' },
  '03': { name: 'Punjab', code: 'PB' },
  // ... all 37 state/UT codes
  '37': { name: 'Andhra Pradesh', code: 'AP' },
}
```

### 4.4 UQC Code Mapping (Config — No Schema Change)

```javascript
export const UQC_CODES = [
  { code: 'NOS', label: 'Numbers' },
  { code: 'KGS', label: 'Kilograms' },
  { code: 'MTR', label: 'Metres' },
  { code: 'LTR', label: 'Litres' },
  { code: 'SQM', label: 'Square Metres' },
  { code: 'CBM', label: 'Cubic Metres' },
  { code: 'PCS', label: 'Pieces' },
  { code: 'SET', label: 'Sets' },
  { code: 'HRS', label: 'Hours' },
  { code: 'OTH', label: 'Others' },
]
```

---

## 5. API Design (New Endpoints)

All new endpoints under `GET /reports/...` with `authenticate` middleware.

```
# GSTR-3B Summary (monthly/quarterly)
GET /reports/gstr3b?month=YYYY-MM

# GSTR-1 Sections
GET /reports/gstr1/b2b?month=YYYY-MM           → B2B invoices
GET /reports/gstr1/b2c-large?month=YYYY-MM      → B2C Large (>2.5L interstate)
GET /reports/gstr1/b2c-small?month=YYYY-MM      → B2C Small (summary)
GET /reports/gstr1/credit-notes?month=YYYY-MM   → Credit/Debit notes
GET /reports/gstr1/doc-summary?month=YYYY-MM    → Document summary
GET /reports/gstr1/hsn?month=YYYY-MM            → HSN summary

# Sales Register
GET /reports/sales-register?dateFrom=&dateTo=

# Receivables
GET /reports/receivables?asOfDate=YYYY-MM-DD

# Customer-wise
GET /reports/customer-summary?dateFrom=&dateTo=
GET /reports/customer-ledger/:customerId?dateFrom=&dateTo=

# Annual
GET /reports/annual-summary?fy=2025-26
GET /reports/gstr9?fy=2025-26

# Utility
GET /reports/tax-calculator?month=YYYY-MM
GET /reports/top-customers?dateFrom=&dateTo=&limit=10
```

---

## 6. Frontend UI Plan

### 6.1 Reports Page Redesign

Replace the current single-tab reports page with a tabbed/section layout:

```
Reports
├── [Tab] Documents        ← Current reports page (enhanced)
├── [Tab] GST Returns      ← NEW: GSTR-1 + GSTR-3B sections
├── [Tab] Sales Register   ← NEW: Detailed sales log
├── [Tab] Receivables      ← NEW: Aging report
└── [Tab] Annual           ← NEW: FY summary, GSTR-9 data
```

### 6.2 GST Returns Tab Layout

```
GST Returns
├── Period Selector: [Month ▾] [Year ▾]  [Generate ▸]
├── GSTR-3B Summary Card (collapsible)
│   ├── 3.1 Outward supplies table
│   └── 5.1 Tax payable summary
├── GSTR-1 Sections (collapsible cards)
│   ├── Table 4A: B2B Invoices [Export CSV] [Export JSON]
│   ├── Table 5A: B2C Large [Export]
│   ├── Table 7: B2C Small [Export]
│   ├── Table 9B: Credit/Debit Notes [Export]
│   ├── Table 12: HSN Summary [Export]
│   └── Table 13: Document Summary [Export]
└── [Download All as ZIP]  [Print Full Report]
```

### 6.3 Export Formats per Report

| Report | CSV | Excel | PDF | JSON | Print | ZIP |
|--------|-----|-------|-----|------|-------|-----|
| GSTR-3B Summary | ✓ | — | ✓ | ✓ | ✓ | — |
| GSTR-1 B2B | ✓ | ✓ | ✓ | ✓ | ✓ | — |
| GSTR-1 B2C Large | ✓ | ✓ | ✓ | — | ✓ | — |
| GSTR-1 B2C Small | ✓ | ✓ | ✓ | — | ✓ | — |
| GSTR-1 Credit Notes | ✓ | ✓ | ✓ | — | ✓ | — |
| GSTR-1 Doc Summary | ✓ | — | ✓ | — | ✓ | — |
| Sales Register | ✓ | ✓ | ✓ | — | ✓ | — |
| Receivables Aging | ✓ | — | ✓ | — | ✓ | — |
| Annual Summary | ✓ | ✓ | ✓ | — | ✓ | — |
| GSTR-9 Data | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Customer Ledger | ✓ | — | ✓ | — | ✓ | — |

---

## 7. Implementation Phases

### Phase R1 — Core Monthly Reports (P0)
**Effort**: ~3-4 days

1. Backend: `GET /reports/gstr3b` endpoint
2. Backend: `GET /reports/gstr1/b2b` endpoint
3. Backend: `GET /reports/sales-register` endpoint
4. Frontend: GST Returns tab with GSTR-3B + B2B sections
5. Frontend: Sales Register tab
6. Export: CSV + PDF for all three reports
7. Schema: Add `paidAt` field to Invoice model + migration

### Phase R2 — Complete GSTR-1 + Receivables (P1)
**Effort**: ~3-4 days

1. Backend: GSTR-1 B2C Large, B2C Small, Document Summary endpoints
2. Backend: Credit/Debit Notes endpoint
3. Backend: Receivables aging endpoint
4. Backend: Tax payment calculator endpoint
5. Frontend: Complete GSTR-1 sections in GST Returns tab
6. Frontend: Receivables tab
7. Schema: Add `originalInvoiceId`, `reverseCharge` to Invoice + migration

### Phase R3 — Annual Reports + Customer Reports (P1-P2)
**Effort**: ~2-3 days

1. Backend: Annual summary, GSTR-9 data, customer-wise summary endpoints
2. Backend: Customer ledger endpoint
3. Frontend: Annual tab with FY selector
4. Frontend: Customer summary/ledger views
5. Export: Full GSTR-9 compatible JSON export

### Phase R4 — HSN Support + Advanced (P2)
**Effort**: ~3-4 days

1. Schema: Add `hsnCode`, `uqc` to InvoiceLineItem and ProductService + migration
2. Config: Indian states mapping, UQC codes
3. Frontend: HSN/UQC fields in product form and invoice line items
4. Backend: HSN summary endpoint for GSTR-1 Table 12 and GSTR-9 Table 17
5. Frontend: HSN Summary section in GST Returns tab

---

## 8. Supply Type Classification Logic (Derivable — No New Fields)

The B2B/B2C/Export classification can be derived from existing data:

```javascript
function classifySupply(invoice, customer, business) {
  const hasGSTIN = !!customer?.gstin
  const isInterstate = business.stateCode !== invoice.placeOfSupplyStateCode
  const isLargeValue = parseFloat(invoice.total) > 250000

  if (hasGSTIN) {
    return 'B2B'                              // Table 4A
  }
  if (isInterstate && isLargeValue) {
    return 'B2C_LARGE'                        // Table 5A
  }
  return 'B2C_SMALL'                          // Table 7
}
```

---

## 9. Limitations & Future Considerations

### Current Scope (Sales-only App)
- **No purchase tracking** → Cannot show Input Tax Credit (ITC) in GSTR-3B sections 4 & 6
- **No expense management** → Cannot generate full P&L statement
- **Invoice-level tax only** → Mixed HSN rates per line item is future work
- **No e-invoicing integration** → E-invoice (IRN) generation via NIC portal is out of V1 scope
- **No GSTR-2B reconciliation** → Requires purchase data from suppliers

### Future Enhancements (Post-V1)
- E-invoice generation (mandatory for businesses > ₹5 Cr turnover)
- E-way bill generation (for goods transport > ₹50K)
- GSTR-1 JSON export compatible with GST portal offline tool
- TDS/TCS reports (Section 194Q, 206C(1H))
- Multi-currency support for export invoices
- Automated filing reminders and due-date notifications

---

## 10. Notes for CAs and Tax Professionals

The app should include a "Share with CA" feature:
- Generate a **CA Package ZIP** containing:
  1. Sales Register (CSV)
  2. GSTR-1 all sections (CSV)
  3. GSTR-3B summary (PDF)
  4. Receivables aging (PDF)
  5. Customer-wise summary (CSV)
  6. All invoice PDFs (ZIP)
- Single button: **"Export for CA"** with period selector
- Output: Single ZIP file named `InvoiceBaba_[BusinessName]_[Period].zip`

---

**End of Plan**
