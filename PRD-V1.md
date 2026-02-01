# Product Requirements Document (PRD) — Invoice App (V1 Final)
**Version:** 1.0  
**Region:** India (GST)  
**Auth:** Phone OTP  
**Primary Platform:** Mobile-first (PWA or mobile web; desktop supported)  
**Core Output:** PDF invoice + WhatsApp share + Download + Print  
**Product Principles:** Invisible UI, minimal entry, fast onboarding, fast invoice generation

---

## 1) Overview

### 1.1 Purpose
Build a minimal invoice application for small businesses with limited products/services. The app’s primary job is to let business users create invoices quickly on mobile, generate a PDF, and share it via WhatsApp or download/print—while keeping customer/product info minimal and auto-saved for reuse.

### 1.2 Target Users
- Micro-SME owners, freelancers, service providers in India
- Users who invoice frequently on-site or immediately after completing work
- Users who prefer speed and simplicity over accounting complexity

### 1.3 Guiding Principles (Invisible UI)
- **Default-first:** user can invoice immediately after OTP login.
- **Progressive disclosure:** show advanced fields only when required (GST, due date, notes).
- **Auto-save & reuse:** capture customers and products from invoices automatically.
- **One primary action:** “New Invoice” is always prominent.
- **Output-first:** after generating PDF, WhatsApp share is the primary CTA.
- **No data loss:** drafts autosave continuously and recover on relaunch.

---

## 2) Goals & Success Metrics

### 2.1 Goals (V1)
- OTP onboarding that gets users to “New Invoice” quickly
- Invoice creation with minimal inputs and strong defaults
- GST support (invoice-level tax) suitable for common billing use-cases
- Per-business template customization without engineering intervention
- Plan/limit readiness for premium monetization (monthly invoice limits on free plan)

### 2.2 Success Metrics (V1)
- **Time-to-first-PDF:** median < 2 minutes from OTP verification
- **Invoice completion time (returning):** median < 60 seconds
- **Draft loss rate:** < 1% sessions
- **WhatsApp share completion:** > 80% of share attempts succeed
- **PDF generation time:** typical case < 2 seconds (device/network dependent)
- **Plan limit prompt funnel:** track (limit reached → upgrade view → upgrade start)

---

## 3) Roles & Access Model

### 3.1 Roles (Only Two)
- **User (Business User):** self-registers via OTP, uses app to create/manage invoices, customers, products, templates within their business.
- **Super Admin (Platform Admin):** internal admin role to manage platform defaults/templates catalog, plan configuration, business/user status and support operations.

### 3.2 Business Team / Multi-user
- **Not required in V1.**  
  V1 assumes one business workspace is owned/operated by one user login.
- Architecture should remain compatible with future “invite team members” capability, but no UI/flows in V1.

---

## 4) Scope

### 4.1 Modules Included (V1)
1. **Invoices**
2. **Customers**
3. **Products/Services**
4. **Reports (minimal)**
5. **Settings**
6. **Templates** (per-business customization + PDF rendering)

### 4.2 Out of Scope (V1)
- Inventory/stock management
- Purchase orders
- Online payment collection links (UPI/Stripe/PayPal) *(future)*
- Full GST compliance filing exports (GSTR-1/3B) *(future)*
- Item-level mixed GST rates *(future; V1 uses invoice-level tax)*

---

## 5) Core User Journeys

### 5.1 OTP Onboarding (Self Registration)
**Flow**
1. Enter phone number
2. Receive OTP
3. Verify OTP
4. Create business workspace automatically
5. Optional setup prompts (skippable):
   - Business name
   - State (recommended for GST)
6. Land on **New Invoice**

**Acceptance Criteria**
- User can generate a PDF invoice without completing profile fields.
- If critical GST fields are missing, the UI should guide gently (soft prompts) without blocking non-GST invoicing.

---

### 5.2 Quick Invoice Generation (Primary Flow)
**Minimum required to generate PDF**
- Customer name or phone
- At least 1 line item with name + amount (qty defaults to 1)

**Flow**
1. Select/Add customer (typeahead)
2. Add line item(s) (typeahead)
3. Optional “Add details” section (collapsed):
   - GST tax (if enabled)
   - Discount
   - Due date
   - Notes/terms
4. Tap **Generate PDF**
5. Post-generation actions:
   - **Share on WhatsApp** (primary)
   - Download PDF
   - Print

**Acceptance Criteria**
- New invoice screen is usable with one hand on a phone.
- Invoice is autosaved continuously.
- PDF generation and WhatsApp share should be reachable in <= 2 taps after invoice completion.

---

### 5.3 Auto-save Customers & Products
**Flow**
- When user enters a new customer during invoice creation, save it automatically.
- When user enters a new product/service line item, save it automatically.

**Acceptance Criteria**
- Suggestions appear after 2–3 characters.
- Deduping prevents duplicates caused by case/extra spaces.

---

## 6) Functional Requirements

## 6.1 Invoices
### Create/Edit
- Single-page mobile-first editing
- Fields:
  - Invoice number (auto)
  - Date (default today)
  - Customer (typeahead + create inline)
  - Items list (add/remove)
  - Subtotal/discount/tax/grand total (auto-calculated)
  - Notes/terms (optional)
  - Due date (optional)
- Line item fields:
  - name (required)
  - quantity (default 1)
  - rate/amount (required)
  - line total (computed)

### Autosave & Drafts
- Save after each meaningful change (local + backend sync when online).
- Draft recovery on app relaunch.

### Status
- Draft
- Issued (PDF generated)
- Paid (manual toggle)
- Cancelled/Void (optional)

### Search & Filters
- Search by invoice number and customer
- Filter by date range and status

### Invoice Numbering
- Default: `INV-0001`
- Business can configure:
  - prefix (e.g., `INV-`, `TAX-INV-`)
  - next invoice number (with collision validation)
- Validation:
  - no duplicates
  - cannot set next number below already-issued highest number

---

## 6.2 GST (India) — Invoice-Level Tax (V1)
### GST Mode
- Setting: GST enabled toggle for the business.

### Place of Supply & Tax Mode (V1)
- Business state is stored in settings (recommended during onboarding).
- Customer state optional.
- Determine tax mode:
  - Same state → CGST + SGST
  - Different state → IGST

### Tax Rate
- Presets: 0%, 5%, 12%, 18%, 28% + custom rate input.

### PDF Requirements for GST Invoices
- Show taxable value, tax breakup and grand total:
  - CGST + SGST amounts or IGST amount
- Business GSTIN displayed if provided (configurable per template).

**Acceptance Criteria**
- Correct invoice-level tax calculation and breakup.
- GST fields shown only when GST is enabled (progressive disclosure).

---

## 6.3 Customers
### Customer Fields (Minimal)
- name (required OR phone required)
- phone (optional)
- GSTIN (optional)
- state (optional)
- address (optional; hidden by default)

### Customer List
- Searchable
- Quick action: “Create invoice” from customer profile

---

## 6.4 Products/Services
### Product/Service Fields (Minimal)
- name (required)
- default rate (optional)
- unit (optional)

### Behavior
- Primarily supports suggestions/autocomplete in invoice line items.

---

## 6.5 Reports (Minimal V1)
- Total invoiced:
  - Today / This week / This month / Custom range
- Paid vs unpaid totals
- Basic GST summary:
  - total taxable value
  - total GST collected
  - IGST total vs CGST/SGST totals (optional)

---

## 6.6 Settings
### Business Profile
- business name
- logo
- phone/email (optional)
- address (optional)
- state (for GST logic)
- GSTIN (optional)

### Invoice Defaults
- invoice prefix
- next invoice number
- default notes/terms
- default GST toggle (optional)
- default tax rate (optional)

### Templates
- select active template
- open template customization editor
- preview PDF

---

## 7) Templates — Per-business Customization (V1)

### 7.1 Requirement
Each business must be able to fully customize their invoice template without engineering involvement, while the platform retains stable PDF generation and layout consistency.

### 7.2 Template Architecture (Two-layer)
- **Base Template (System)**: predefined layouts/components managed by Super Admin.
- **Business Template Config (Per Business)**: customization config applied to a base template.

### 7.3 Customization Capabilities (V1)
**Branding**
- logo on/off
- logo position
- primary/accent color
- font style (limited set)

**Layout Controls**
- header alignment
- spacing density (compact/regular)
- section ordering (within allowed rules)

**Visibility Toggles (Show/Hide)**
- business GSTIN
- customer GSTIN
- place of supply
- due date
- notes/terms
- signature block
- bank/UPI details block (optional field)
- discount and tax lines

**Text & Labels**
- invoice title (e.g., “Invoice”, “Tax Invoice”)
- default footer message
- default terms

### 7.4 Template Editor UX (V1)
- Settings → Templates → Customize
- Controls on top, live preview panel below
- Actions:
  - Save
  - Preview PDF
  - Set as default

### 7.5 Invoice Snapshotting (Critical)
When invoice is issued (PDF generated), store a **template snapshot** used for that invoice:
- baseTemplateId
- configSnapshot JSON
This ensures previously issued invoices remain consistent even if the business changes template settings later.

**Acceptance Criteria**
- Template changes affect new invoices only (unless explicitly “apply to draft”).
- Issued invoices always render with the exact snapshot used at issuance.

---

## 8) Plans, Limits & Premium Readiness

### 8.1 Confirmed Free Plan Limitation
- Free plan uses **monthly invoice limits**.

### 8.2 Enforcement Point (V1)
- Enforce limit at **Generate PDF / Issue invoice**.
  - User may create drafts beyond limit, but cannot generate new PDFs once the monthly limit is reached.

### 8.3 Entitlement Model (Plan-ready)
Entitlements should be configurable by plan (examples):
- `monthlyInvoicesLimit`
- `customersLimit`
- `productsLimit`
- `templatesLimit`
- advanced template customization options
- export availability (CSV)
- advanced reports

### 8.4 Upgrade UX
- Only prompt upgrade when user hits a limit or tries to use premium-only feature.
- Provide:
  - Upgrade CTA
  - Not now
  - Explanation of what is blocked and what remains accessible

**Acceptance Criteria**
- User can still view/download/share previously issued invoices even after hitting limits.
- Clear messaging and consistent enforcement for implicit creations (customer/product autosave must respect limits).

---

## 9) Data Model (Conceptual)

### 9.1 Core Entities
- **User**
  - id, phone, otpVerifiedAt, createdAt
- **Business**
  - id, ownerUserId, name, stateCode, gstEnabled, gstin, logoUrl, createdAt
- **Customer**
  - id, businessId, name, phone, gstin, stateCode, address, createdAt
- **ProductService**
  - id, businessId, name, defaultRate, unit, createdAt
- **Invoice**
  - id, businessId, invoiceNumber, date, dueDate, status
  - customerId
  - subtotal, discountTotal, taxTotal, total
  - taxMode (IGST / CGST_SGST), taxRate, taxBreakup
  - templateBaseId, templateConfigSnapshot
  - pdfUrl, issuedAt
- **InvoiceLineItem**
  - id, invoiceId, name, quantity, rate, lineTotal, productServiceId (optional)

### 9.2 Templates
- **BaseTemplate**
  - id, name, supportedConfigSchema, active
- **BusinessTemplateConfig**
  - id, businessId, baseTemplateId, configJson, version, updatedAt

### 9.3 Plans & Usage
- **Plan**
  - id, name, entitlementsJson
- **Subscription**
  - id, businessId, planId, status, renewAt
- **UsageCounter**
  - businessId, monthKey, invoicesIssuedCount

---

## 10) Non-Functional Requirements
- **Performance:** fast first load, smooth typing, minimal UI jank
- **Reliability:** autosave and draft recovery must be robust
- **Security:** OTP auth, secure sessions, TLS everywhere, encrypt sensitive data at rest (server-side)
- **Scalability:** template rendering and PDF generation should handle growth
- **Observability:** track onboarding completion, invoice issuance, PDF generation failures, WhatsApp share attempts

---

## 11) Acceptance Criteria Summary (V1 “Done”)
- OTP onboarding works end-to-end.
- User can create invoice with minimal fields and generate PDF.
- GST invoice-level tax works with IGST/CGST+SGST determination based on state.
- WhatsApp share is the primary post-PDF action and works reliably.
- Customers/products auto-save and suggestions work.
- Per-business template customization works with preview and invoice snapshotting.
- Free plan monthly invoice limit enforced at “Generate PDF/Issue”.
- Super Admin can manage plans and base templates.

---

## 12) Open Configuration (To be finalized during implementation)
- Free plan monthly invoice limit value (e.g., 10/20/30)
- Template count and customization depth per plan
- Whether GST is prompted during onboarding or enabled later via settings

---
**Document Status:** Finalized V1 PRD (based on confirmed decisions: OTP auth, India+GST, invoice-level tax, WhatsApp share, monthly invoice limits, per-business template customization, no business team management in V1, platform Super Admin role).
