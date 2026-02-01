# Invoice App - Complete Feature Definition (V1)

**Based on**: `PRD-V1.md` + `server/prisma/schema.prisma`  
**Primary User Goal**: Generate a professional invoice PDF quickly and share via WhatsApp  
**Critical Path**: User Registration (OTP) → New Invoice → Generate PDF → Download/Share

---

# Non‑Negotiables (Your Inputs)

## Invisible UI Principles (Applied Everywhere)
- **Default-first**: user can invoice immediately after OTP.
- **Progressive disclosure**: advanced fields stay hidden until needed.
- **Auto-save & reuse**: customers/products captured from invoices and suggested later.
- **One primary action**: always surface `New Invoice` + `Generate PDF`.
- **Output-first**: post-PDF action focuses on WhatsApp share and download.
- **No data loss**: drafts auto-save + recover.

## Mobile-first UI (No Separate Mobile App)
- The web app must be **touch-first**, **one-hand friendly**, and **Capacitor-ready**.
- **UI library requirement**: use a mobile-friendly component library to reduce UI boilerplate.
  - Recommended: **Ionic React** (best fit with Capacitor, iOS/Android-native UX patterns).
  - Allowed alternative: Tailwind + headless components *only if* mobile ergonomics remain excellent.

## Less Boilerplate + Reusability
- Prefer reusable primitives over copy-paste screens:
  - `MoneyInput`, `PhoneInput`, `DatePicker`, `Typeahead`, `LineItemRow`, `TotalsSummary`, `PdfActionsSheet`.
- Prefer a small number of predictable patterns:
  - Form validation: Zod schemas reused on both client + server (same shape, separate packages).
  - Data fetching/caching: TanStack Query (avoid custom fetch caching code).
  - UI state: Zustand only where needed; keep most state local to screens.

## Frontend + Backend Independence Contract
- **Independent deployments**:
  - `app/` (PWA + Capacitor shell) must run independently.
  - `server/` must run independently as a stateless JSON API.
- **No server-side PDF generation/storage**:
  - Server never stores `pdfUrl` and never generates PDFs.
  - Client generates PDFs on-demand from invoice data + template snapshot.
- **Loose coupling**:
  - Only contract is HTTP API + JSON payloads.
  - No shared runtime, no monorepo shared imports required.

---

# Phase-by-Phase Delivery Plan (LLM-friendly)

Each phase below is intentionally written to be used as a build plan.  
Every phase includes:
- **User flows**
- **Screens**
- **API endpoints**
- **Schema models involved**
- **Definition of Done**

---

# PHASE 1: MVP — Registration → Download Invoice (Critical Path)

## Goal
User can complete OTP onboarding and download their first invoice PDF in < 2 minutes.

## Deliverables (Frontend)
- **Auth screens**: Phone → OTP → auto-redirect to `New Invoice`.
- **New Invoice screen**: mobile-first single-screen editor.
- **Autosave drafts** locally.
- **Generate PDF** on client (no server PDF).
- **Download PDF**.

## Deliverables (Backend)
- **OTP auth API** (request + verify).
- **Create business workspace automatically** on first verification.
- **Invoice draft CRUD** (minimal required fields validation).

## Definition of Done
- User can:
  - register/login via OTP.
  - create an invoice with minimal fields.
  - generate PDF and download it.
  - close app and reopen to see draft recovered.

## 1.1 Authentication & Onboarding

### Feature: Phone OTP Registration
**Priority**: P0 (Critical Path)  
**User Story**: As a new user, I want to register with my phone number so I can start creating invoices immediately.

**Acceptance Criteria**:
- ✅ User enters phone number (10 digits, India format)
- ✅ OTP sent via SMS (6 digits, 5 min expiry)
- ✅ User verifies OTP
- ✅ Business workspace auto-created
- ✅ User lands on "New Invoice" screen (not settings)
- ✅ Time to first screen: < 30 seconds

**Schema Models**: `User`, `OtpRequest`, `Business`

**API Endpoints**:
```
POST /auth/request-otp
POST /auth/verify-otp
GET  /auth/me
```

**UI Screens**:
1. **Phone Entry Screen**
   - Single input: phone number
   - Primary CTA: "Send OTP"
   - No extra fields (Invisible UI)

2. **OTP Verification Screen**
   - 6-digit OTP input
   - Auto-submit on 6th digit
   - Resend OTP (30s cooldown)
   - Primary CTA: "Verify"

3. **Auto-redirect to New Invoice**
   - Skip profile setup (can be done later)
   - Business created with defaults

**Offline Support**: Not applicable (requires network for OTP)

---

### Feature: Optional Business Setup (Skippable)
**Priority**: P1 (Can defer)  
**User Story**: As a user, I want to optionally add business details so my invoices look professional.

**Acceptance Criteria**:
- ✅ Shown as bottom sheet/modal (dismissible)
- ✅ Fields: Business name, State (for GST)
- ✅ "Skip for now" prominent
- ✅ Can complete later in Settings

**Schema Models**: `Business`

**UI Screens**:
1. **Quick Setup Modal** (Optional, shown once)
   - Business name (optional)
   - State selection (optional, for GST)
   - CTAs: "Skip for now" | "Save & Continue"

**Offline Support**: Saved locally, synced when online

---

## 1.2 Invoice Creation (Core Flow)

### Feature: Quick Invoice Creation
**Priority**: P0 (Critical Path)  
**User Story**: As a user, I want to create an invoice with minimal inputs so I can generate a PDF quickly.

**Acceptance Criteria**:
- ✅ Single-screen invoice form
- ✅ Minimum required: Customer name/phone + 1 line item
- ✅ Auto-save every 2 seconds
- ✅ Smart defaults (date=today, qty=1, invoice number auto-incremented)
- ✅ Advanced fields collapsed (GST, discount, due date, notes)
- ✅ Mobile-optimized (one-hand usable)
- ✅ Time to complete: < 60 seconds for returning users

**Schema Models**: `Invoice`, `InvoiceLineItem`, `Customer`, `ProductService`

**API Endpoints**:
```
POST   /invoices (create draft)
PATCH  /invoices/:id (update draft)
POST   /invoices/:id/issue (mark as issued, enforce limits)
GET    /invoices
GET    /invoices/:id
```

**UI Screens**:
1. **New Invoice Screen** (Single Page)
   
   **Section 1: Invoice Meta** (Auto-filled)
   - Invoice Number: `INV-0001` (auto, read-only)
   - Date: Today (editable via date picker)
   
   **Section 2: Customer** (Typeahead)
   - Input: "Customer name or phone"
   - Dropdown: Recent customers (auto-suggest)
   - Create inline if new
   
   **Section 3: Line Items** (Dynamic List)
   - Item name (typeahead from products)
   - Quantity (default: 1)
   - Rate/Amount
   - Line total (auto-calculated)
   - Add/Remove item buttons
   
   **Section 4: Totals** (Auto-calculated)
   - Subtotal
   - Discount (if > 0)
   - Tax (if GST enabled)
   - **Grand Total** (prominent)
   
   **Section 5: Advanced Details** (Collapsed by default)
   - 🔽 "Add details" accordion
     - GST toggle & rate selector
     - Discount
     - Due date
     - Notes
     - Terms
   
   **Primary CTAs**:
   - "Save as Draft" (auto-saved, secondary)
   - **"Generate PDF"** (primary, prominent)

**Offline Support**:
- Draft saved to IndexedDB immediately
- Synced to server when online
- UUID generated client-side
- Idempotency key for sync

---

### Feature: Customer Auto-save & Suggestions
**Priority**: P0 (Critical Path)  
**User Story**: As a user, I want customers auto-saved from invoices so I don't re-enter details.

**Acceptance Criteria**:
- ✅ Typeahead shows suggestions after 2 characters
- ✅ New customer auto-created when invoice saved
- ✅ Deduplication by normalized name/phone
- ✅ Recent customers shown first

**Schema Models**: `Customer`

**API Endpoints**:
```
GET    /customers?search=query
POST   /customers (auto-created from invoice)
GET    /customers/:id
PATCH  /customers/:id
```

**UI Components**:
- **Customer Typeahead**
  - Search by name or phone
  - Shows: Name, Phone (if available)
  - "Add new customer" option at bottom
  - Inline creation (name + phone only)

**Offline Support**:
- Customers synced to IndexedDB
- Typeahead works offline
- New customers created locally, synced later

---

### Feature: Product/Service Auto-save & Suggestions
**Priority**: P0 (Critical Path)  
**User Story**: As a user, I want products auto-saved from line items so I can reuse them quickly.

**Acceptance Criteria**:
- ✅ Typeahead shows product suggestions
- ✅ Auto-fills rate when product selected
- ✅ New products auto-created from line items
- ✅ Deduplication by normalized name

**Schema Models**: `ProductService`

**API Endpoints**:
```
GET    /products?search=query
POST   /products (auto-created from invoice)
GET    /products/:id
PATCH  /products/:id
```

**UI Components**:
- **Product Typeahead** (in line item)
  - Search by name
  - Shows: Name, Default rate
  - Auto-fills rate when selected
  - User can override rate

**Offline Support**:
- Products synced to IndexedDB
- Typeahead works offline

---

## 1.3 PDF Generation & Sharing

### Feature: Client-Side PDF Generation
**Priority**: P0 (Critical Path)  
**User Story**: As a user, I want to generate a PDF invoice so I can share it with customers.

**Acceptance Criteria**:
- ✅ PDF generated in browser (no server storage)
- ✅ Uses template snapshot for consistency
- ✅ Generation time: < 2 seconds
- ✅ Works offline (after initial sync)
- ✅ PDF includes all invoice data + GST breakup

**Schema Models**: `Invoice`, `BaseTemplate`, `BusinessTemplateConfig`

**API Endpoints**:
```
POST   /invoices/:id/issue (snapshots template, enforces limits)
GET    /templates/base/:id (get template renderConfig)
```

**Implementation**:
- **Method**: Browser Print API (V1) or @react-pdf/renderer (Production)
- **Template Registry**: React components for each template
- **Rendering Flow**:
  1. Get invoice data + snapshot
  2. Load template component
  3. Render with config
  4. Generate PDF blob
  5. Return for download/share

**UI Screens**:
1. **PDF Preview Screen** (After generation)
   - PDF preview (iframe or canvas)
   - Primary CTAs:
     - **"Share on WhatsApp"** (primary)
     - "Download PDF"
     - "Print"
   - Secondary: "Back to Invoice"

**Offline Support**:
- Template renderConfig cached locally
- PDF can be generated offline from synced data

---

### Feature: WhatsApp Share
**Priority**: P0 (Critical Path)  
**User Story**: As a user, I want to share invoices via WhatsApp so I can send them to customers immediately.

**Acceptance Criteria**:
- ✅ One-tap share to WhatsApp
- ✅ PDF attached automatically
- ✅ Pre-filled message template
- ✅ Works on mobile (Capacitor Share API)
- ✅ Fallback to download on desktop

**Implementation**:
- **Mobile**: Capacitor Share plugin
- **Desktop**: Download PDF + copy WhatsApp link

**UI Flow**:
1. User taps "Share on WhatsApp"
2. PDF saved to temp storage
3. Native share sheet opens
4. User selects WhatsApp
5. Message pre-filled: "Please find attached Invoice #INV-0001"
6. User selects contact and sends

**Offline Support**: Requires network for WhatsApp (PDF generated offline)

---

### Feature: Download & Print
**Priority**: P1 (Important)  
**User Story**: As a user, I want to download or print invoices so I can keep records or provide hard copies.

**Acceptance Criteria**:
- ✅ Download saves PDF to device
- ✅ Filename: `Invoice-{number}.pdf`
- ✅ Print opens browser print dialog
- ✅ Print-optimized CSS

**UI Components**:
- Download button (triggers blob download)
- Print button (opens print dialog)

**Offline Support**: Fully offline capable

---

# PHASE 2: Invoice Lifecycle + WhatsApp-first Sharing

## Goal
User can manage invoices end-to-end and share via WhatsApp reliably.

## Deliverables (Frontend)
- Invoice list + search + filters.
- Invoice detail view.
- Status changes (Paid / Cancelled / Void).
- WhatsApp share:
  - PWA fallback.
  - Capacitor share sheet for Android/iOS builds.

## Deliverables (Backend)
- List/search APIs optimized with indexes.
- Status update API + audit logging.

## Definition of Done
- A user can find any invoice quickly, re-generate PDF from snapshot, and share.

---

# PHASE 3: India GST + Numbering + Business Defaults

## Goal
GST works with minimal UX friction and correct output in PDFs.

## Deliverables
- Business GST settings (toggle, GSTIN, state, default tax rate).
- Invoice-level GST calculation + breakup (IGST vs CGST+SGST).
- Invoice numbering settings:
  - prefix, next number.
  - collision validation.
  - cannot set next number below highest issued.
- Minimal reports:
  - total invoiced.
  - paid vs unpaid.
  - basic GST summary.

## Definition of Done
- GST invoices display correct breakup and totals.
- Defaults reduce typing to near-zero for repeat invoices.

---

# PHASE 4: Templates (Per-business Customization) + Snapshotting

## Goal
Businesses can customize templates without engineering and invoices remain consistent over time.

## Deliverables
- Template selection.
- Template editor with:
  - branding.
  - layout controls.
  - visibility toggles.
  - labels + footer.
- Snapshot on issuance (`templateBaseId`, `templateConfigSnapshot`, `templateVersion`).

## Definition of Done
- Template changes affect new invoices only.
- Issued invoices always render with the exact snapshot.

---

# PHASE 5: Offline-first Sync Engine (Production-grade)

## Goal
App is reliable offline and syncs safely with minimal bugs.

## Deliverables
- Outbox pattern for mutations.
- Delta sync strategy.
- Idempotency keys.
- Conflict rules:
  - issued invoices are immutable.
  - drafts can merge conservatively.
- Sync status UI (online/offline/syncing + last sync time).

## Definition of Done
- User can create drafts offline and safely sync later.
- No duplicate invoices from retries.

---

# PHASE 6: Plans + Limits + Admin Operations

## Goal
Freemium readiness with monthly invoice limits and admin management.

## Deliverables
- Monthly invoice limit enforced at `Issue` (not at draft).
- Upgrade prompts when blocked.
- Super Admin operations (separate admin UI/app optional):
  - manage base templates.
  - manage plans.
  - manage business/user status.

## Definition of Done
- Free plan users can always view/share old invoices.
- Limits block only new issuances.

---

# Detailed Feature Specs (Reference)

The sections below contain detailed feature-by-feature specifications.

## 2.1 Invoice Management

### Feature: Invoice List & Search
**Priority**: P1 (Important)  
**User Story**: As a user, I want to view and search my invoices so I can find past invoices quickly.

**Acceptance Criteria**:
- ✅ List view with key info (number, customer, date, amount, status)
- ✅ Search by invoice number or customer name
- ✅ Filter by status (Draft, Issued, Paid, Cancelled)
- ✅ Filter by date range
- ✅ Sort by date (newest first)
- ✅ Infinite scroll / pagination

**Schema Models**: `Invoice`, `Customer`

**API Endpoints**:
```
GET /invoices?search=query&status=ISSUED&dateFrom=&dateTo=&limit=20&offset=0
```

**UI Screens**:
1. **Invoice List Screen**
   - Search bar at top
   - Filter chips (Status, Date range)
   - Invoice cards:
     - Invoice number
     - Customer name
     - Date
     - Amount (prominent)
     - Status badge
   - Tap to view details
   - FAB: "New Invoice"

**Offline Support**:
- List cached in IndexedDB
- Search works offline
- Sync indicator shown

---

### Feature: Invoice Detail View
**Priority**: P1 (Important)  
**User Story**: As a user, I want to view invoice details so I can review before sharing.

**Acceptance Criteria**:
- ✅ Read-only view of all invoice data
- ✅ Actions: Edit (if draft), Generate PDF, Share, Mark as Paid
- ✅ Status change tracking

**UI Screens**:
1. **Invoice Detail Screen**
   - Header: Invoice number, Status badge
   - Customer info
   - Line items table
   - Totals breakdown
   - Notes/Terms (if present)
   - Action buttons based on status:
     - **Draft**: Edit, Delete, Generate PDF
     - **Issued**: Generate PDF, Share, Mark as Paid, Cancel
     - **Paid**: Generate PDF, Share, Mark as Unpaid

**Offline Support**: Full offline viewing

---

### Feature: Invoice Status Management
**Priority**: P1 (Important)  
**User Story**: As a user, I want to mark invoices as paid so I can track payment status.

**Acceptance Criteria**:
- ✅ Status: Draft → Issued → Paid
- ✅ Can mark as Cancelled/Void
- ✅ Status changes logged in audit trail
- ✅ Cannot edit issued invoices (except status)

**Schema Models**: `Invoice`, `AuditLog`

**API Endpoints**:
```
PATCH /invoices/:id/status
```

**UI Components**:
- Status badge (color-coded)
- "Mark as Paid" button
- Confirmation dialog for status changes

**Offline Support**: Status changes queued, synced later

---

### Feature: Draft Auto-save & Recovery
**Priority**: P0 (Critical)  
**User Story**: As a user, I want drafts auto-saved so I never lose work.

**Acceptance Criteria**:
- ✅ Auto-save every 2 seconds while editing
- ✅ Draft recovered on app relaunch
- ✅ Visual indicator: "Saving..." → "Saved"
- ✅ No data loss on crash/close

**Implementation**:
- Debounced save to IndexedDB
- Background sync to server
- Conflict resolution (server wins for issued invoices)

**UI Components**:
- Save indicator in header
- Toast on successful sync

**Offline Support**: Primary use case

---

## 2.2 GST Support (India)

### Feature: GST Configuration
**Priority**: P1 (Important for India)  
**User Story**: As a business owner, I want to enable GST so my invoices are tax-compliant.

**Acceptance Criteria**:
- ✅ GST toggle in business settings
- ✅ GSTIN input (15 characters, validated)
- ✅ State selection (for place of supply)
- ✅ Default tax rate setting

**Schema Models**: `Business`

**API Endpoints**:
```
PATCH /business/settings
```

**UI Screens**:
1. **Business Settings → GST Section**
   - Toggle: "Enable GST"
   - GSTIN input (shown when enabled)
   - State dropdown
   - Default tax rate (0%, 5%, 12%, 18%, 28%, Custom)

**Offline Support**: Settings synced

---

### Feature: Invoice-Level GST Calculation
**Priority**: P1 (Important for India)  
**User Story**: As a user, I want GST auto-calculated so I don't make tax errors.

**Acceptance Criteria**:
- ✅ Tax mode auto-determined (IGST vs CGST+SGST)
- ✅ Based on business state vs customer state
- ✅ Tax breakup shown in PDF
- ✅ Supports custom tax rates

**Schema Models**: `Invoice` (taxMode, taxRate, taxBreakup)

**Calculation Logic**:
```javascript
if (!gstEnabled) {
  taxMode = NONE
} else if (businessState === customerState) {
  taxMode = CGST_SGST
  cgst = taxRate / 2
  sgst = taxRate / 2
} else {
  taxMode = IGST
  igst = taxRate
}
```

**UI Components**:
- Tax rate selector (in advanced section)
- Tax breakup display in totals
- GST summary in PDF

**Offline Support**: Calculation done client-side

---

### Feature: GST Reports (Basic)
**Priority**: P2 (Nice to have)  
**User Story**: As a business owner, I want basic GST reports so I can track tax collected.

**Acceptance Criteria**:
- ✅ Total taxable value
- ✅ Total GST collected
- ✅ IGST vs CGST/SGST breakdown
- ✅ Date range filter

**Schema Models**: `Invoice`

**API Endpoints**:
```
GET /reports/gst?dateFrom=&dateTo=
```

**UI Screens**:
1. **Reports → GST Summary**
   - Date range selector
   - Cards:
     - Total Taxable Value
     - Total GST Collected
     - IGST Total
     - CGST + SGST Total
   - Export CSV (premium feature)

**Offline Support**: Calculated from cached invoices

---

## 2.3 Customer Management

### Feature: Customer List
**Priority**: P2 (Nice to have)  
**User Story**: As a user, I want to view all customers so I can manage their details.

**Acceptance Criteria**:
- ✅ List of all customers
- ✅ Search by name or phone
- ✅ Shows invoice count per customer
- ✅ Quick action: "Create Invoice"

**Schema Models**: `Customer`

**API Endpoints**:
```
GET /customers?search=query
```

**UI Screens**:
1. **Customers Screen**
   - Search bar
   - Customer cards:
     - Name
     - Phone
     - Invoice count
     - Last invoice date
   - Tap to view details
   - FAB: "Add Customer"

**Offline Support**: Full offline access

---

### Feature: Customer Detail & Edit
**Priority**: P2 (Nice to have)  
**User Story**: As a user, I want to edit customer details so I can keep information updated.

**Acceptance Criteria**:
- ✅ View all customer info
- ✅ Edit name, phone, GSTIN, state, address
- ✅ View customer's invoice history
- ✅ Delete customer (if no invoices)

**Schema Models**: `Customer`, `Invoice`

**API Endpoints**:
```
GET    /customers/:id
PATCH  /customers/:id
DELETE /customers/:id
GET    /customers/:id/invoices
```

**UI Screens**:
1. **Customer Detail Screen**
   - Customer info (editable)
   - Invoice history list
   - Actions: Edit, Delete, Create Invoice

**Offline Support**: Full offline editing

---

## 2.4 Product/Service Management

### Feature: Product List
**Priority**: P2 (Nice to have)  
**User Story**: As a user, I want to view all products so I can manage pricing.

**Acceptance Criteria**:
- ✅ List of all products/services
- ✅ Search by name
- ✅ Shows usage count
- ✅ Quick edit default rate

**Schema Models**: `ProductService`

**API Endpoints**:
```
GET /products?search=query
```

**UI Screens**:
1. **Products Screen**
   - Search bar
   - Product cards:
     - Name
     - Default rate
     - Unit
     - Usage count
   - Tap to edit
   - FAB: "Add Product"

**Offline Support**: Full offline access

---

### Feature: Product Detail & Edit
**Priority**: P2 (Nice to have)  
**User Story**: As a user, I want to edit product details so I can update pricing.

**Acceptance Criteria**:
- ✅ Edit name, default rate, unit
- ✅ Delete product (if not used in invoices)

**Schema Models**: `ProductService`

**API Endpoints**:
```
GET    /products/:id
PATCH  /products/:id
DELETE /products/:id
```

**UI Screens**:
1. **Product Edit Screen**
   - Name input
   - Default rate input
   - Unit input
   - Actions: Save, Delete

**Offline Support**: Full offline editing

---

# PHASE 3: PREMIUM & ADVANCED FEATURES

## 3.1 Plans & Limits

### Feature: Plan Enforcement (Monthly Invoice Limit)
**Priority**: P1 (Important for monetization)  
**User Story**: As a platform, I want to enforce plan limits so I can monetize premium features.

**Acceptance Criteria**:
- ✅ Free plan: 20 invoices/month (configurable)
- ✅ Limit enforced at "Generate PDF / Issue Invoice"
- ✅ User can create unlimited drafts
- ✅ Counter resets monthly
- ✅ Clear error message when limit reached

**Schema Models**: `Plan`, `Subscription`, `UsageCounter`

**API Endpoints**:
```
POST /invoices/:id/issue (checks limit before issuing)
GET  /usage/current-month
```

**Enforcement Logic**:
```javascript
// On issue invoice:
1. Get current month usage
2. Get business plan entitlements
3. If usage >= limit, return 403 with upgrade prompt
4. Else, increment counter and issue invoice
```

**UI Components**:
- Usage indicator in settings (e.g., "15/20 invoices this month")
- Limit reached modal:
  - "You've reached your monthly limit"
  - "Upgrade to Pro for unlimited invoices"
  - CTAs: "Upgrade Now" | "Not Now"

**Offline Support**: Limit check requires server (can't issue offline if near limit)

---

### Feature: Plan Management (Super Admin)
**Priority**: P2 (Admin feature)  
**User Story**: As a super admin, I want to manage plans so I can configure limits and pricing.

**Acceptance Criteria**:
- ✅ Create/edit plans
- ✅ Configure entitlements (JSON)
- ✅ Set pricing (monthly/yearly)
- ✅ Activate/deactivate plans

**Schema Models**: `Plan`

**API Endpoints**:
```
GET    /admin/plans
POST   /admin/plans
PATCH  /admin/plans/:id
DELETE /admin/plans/:id
```

**UI Screens** (Admin Portal):
1. **Plans Management**
   - List of plans
   - Edit entitlements JSON
   - Set pricing
   - Toggle active status

**Offline Support**: Not applicable (admin feature)

---

### Feature: Subscription Management
**Priority**: P2 (Future)  
**User Story**: As a user, I want to upgrade my plan so I can create more invoices.

**Acceptance Criteria**:
- ✅ View current plan
- ✅ Compare plans
- ✅ Upgrade flow (payment integration future)
- ✅ Subscription status tracking

**Schema Models**: `Subscription`

**API Endpoints**:
```
GET  /subscription/current
POST /subscription/upgrade
```

**UI Screens**:
1. **Settings → Subscription**
   - Current plan card
   - Usage stats
   - "Upgrade" button
   
2. **Plan Comparison Screen**
   - Free vs Pro features
   - Pricing
   - CTA: "Upgrade to Pro"

**Offline Support**: View only offline

---

## 3.2 Templates & Customization

### Feature: Template Selection
**Priority**: P1 (Important for branding)  
**User Story**: As a user, I want to select an invoice template so my invoices match my brand.

**Acceptance Criteria**:
- ✅ View available base templates
- ✅ Preview templates
- ✅ Set active template
- ✅ Template count limited by plan

**Schema Models**: `BaseTemplate`, `BusinessTemplateConfig`

**API Endpoints**:
```
GET  /templates/base (list available templates)
GET  /templates/base/:id/preview
POST /templates/business (create config for business)
```

**UI Screens**:
1. **Settings → Templates**
   - Grid of template cards
   - Preview thumbnail
   - "Active" badge on current
   - Tap to preview
   - "Set as Active" button

**Offline Support**: Templates cached locally

---

### Feature: Template Customization
**Priority**: P1 (Important for branding)  
**User Story**: As a user, I want to customize my template so my invoices look professional.

**Acceptance Criteria**:
- ✅ Customize colors (primary, accent)
- ✅ Logo upload & positioning
- ✅ Show/hide fields (GSTIN, signature, bank details, etc.)
- ✅ Font selection (limited set)
- ✅ Spacing density (compact/regular)
- ✅ Live preview
- ✅ Save & apply to new invoices

**Schema Models**: `BusinessTemplateConfig`

**API Endpoints**:
```
GET   /templates/business/:id
PATCH /templates/business/:id
POST  /templates/business/:id/preview
```

**UI Screens**:
1. **Template Editor**
   - **Left Panel**: Controls
     - Branding section:
       - Logo upload
       - Logo position (left/center/right)
       - Primary color picker
       - Accent color picker
       - Font selector
     - Layout section:
       - Header alignment
       - Spacing density
     - Visibility toggles:
       - Show business GSTIN
       - Show customer GSTIN
       - Show place of supply
       - Show due date
       - Show notes/terms
       - Show signature
       - Show bank/UPI details
       - Show discount line
       - Show tax line
     - Text customization:
       - Invoice title (e.g., "Tax Invoice")
       - Footer message
   
   - **Right Panel**: Live Preview
     - Sample invoice with current config
     - Updates in real-time
   
   - **Actions**:
     - "Save" (updates config)
     - "Preview PDF" (generates test PDF)
     - "Reset to Default"

**Offline Support**: Edit offline, sync later

---

### Feature: Template Snapshotting
**Priority**: P0 (Critical for consistency)  
**User Story**: As a user, I want issued invoices to remain unchanged even if I update my template.

**Acceptance Criteria**:
- ✅ Template config frozen at invoice issuance
- ✅ Issued invoices always render with snapshot
- ✅ Template changes only affect new invoices
- ✅ Can view which template version was used

**Implementation**:
- On invoice issue, copy `BusinessTemplateConfig.config` to `Invoice.templateConfigSnapshot`
- PDF generation always uses snapshot (not current config)

**Schema Models**: `Invoice.templateConfigSnapshot`

**Offline Support**: Snapshot stored locally

---

### Feature: Base Template Management (Super Admin)
**Priority**: P2 (Admin feature)  
**User Story**: As a super admin, I want to create base templates so users have options.

**Acceptance Criteria**:
- ✅ Create/edit base templates
- ✅ Define renderConfig (component structure)
- ✅ Define configSchema (what can be customized)
- ✅ Upload preview images
- ✅ Activate/deactivate templates

**Schema Models**: `BaseTemplate`

**API Endpoints**:
```
GET    /admin/templates/base
POST   /admin/templates/base
PATCH  /admin/templates/base/:id
DELETE /admin/templates/base/:id
```

**UI Screens** (Admin Portal):
1. **Base Templates Management**
   - List of templates
   - Edit renderConfig JSON
   - Edit configSchema JSON
   - Upload preview image
   - Toggle active status

**Offline Support**: Not applicable (admin feature)

---

## 3.3 Reports & Analytics

### Feature: Dashboard (Basic)
**Priority**: P2 (Nice to have)  
**User Story**: As a user, I want to see key metrics so I can track my business.

**Acceptance Criteria**:
- ✅ Total invoiced (today, week, month, custom range)
- ✅ Paid vs unpaid totals
- ✅ Invoice count by status
- ✅ Top customers by revenue

**Schema Models**: `Invoice`, `Customer`

**API Endpoints**:
```
GET /reports/dashboard?dateFrom=&dateTo=
```

**UI Screens**:
1. **Dashboard Screen**
   - Date range selector
   - Metric cards:
     - Total Invoiced
     - Paid Amount
     - Unpaid Amount
     - Invoice Count
   - Charts:
     - Revenue trend (line chart)
     - Status breakdown (pie chart)
   - Top customers list

**Offline Support**: Calculated from cached data

---

### Feature: Invoice Reports
**Priority**: P2 (Nice to have)  
**User Story**: As a user, I want to export invoice reports so I can analyze my business.

**Acceptance Criteria**:
- ✅ Filter by date range, status, customer
- ✅ Export to CSV (premium feature)
- ✅ Summary totals

**Schema Models**: `Invoice`

**API Endpoints**:
```
GET /reports/invoices?dateFrom=&dateTo=&status=&customerId=
GET /reports/invoices/export (premium)
```

**UI Screens**:
1. **Reports → Invoices**
   - Filters (date, status, customer)
   - Summary cards
   - Invoice list
   - "Export CSV" button (premium)

**Offline Support**: View only offline

---

## 3.4 Settings & Configuration

### Feature: Business Profile Settings
**Priority**: P1 (Important)  
**User Story**: As a user, I want to update my business profile so my invoices have correct information.

**Acceptance Criteria**:
- ✅ Edit business name
- ✅ Upload logo
- ✅ Edit contact details (phone, email, address)
- ✅ Edit GST details (GSTIN, state)
- ✅ Edit bank/UPI details
- ✅ Upload signature

**Schema Models**: `Business`

**API Endpoints**:
```
GET   /business/settings
PATCH /business/settings
POST  /business/logo (upload)
POST  /business/signature (upload)
```

**UI Screens**:
1. **Settings → Business Profile**
   - Sections:
     - Basic Info (name, logo)
     - Contact (phone, email, address)
     - GST (toggle, GSTIN, state)
     - Bank Details (bank name, account, IFSC, UPI)
     - Signature (upload, signatory name)
   - Save button

**Offline Support**: Edit offline, sync later

---

### Feature: Invoice Defaults
**Priority**: P1 (Important)  
**User Story**: As a user, I want to set invoice defaults so I don't repeat common settings.

**Acceptance Criteria**:
- ✅ Invoice prefix (e.g., "INV-", "TAX-INV-")
- ✅ Next invoice number
- ✅ Default notes
- ✅ Default terms & conditions
- ✅ Default tax rate

**Schema Models**: `Business`

**API Endpoints**:
```
PATCH /business/settings
```

**UI Screens**:
1. **Settings → Invoice Defaults**
   - Invoice prefix input
   - Next invoice number (with validation)
   - Default notes textarea
   - Default terms textarea
   - Default tax rate selector
   - Save button

**Offline Support**: Edit offline, sync later

---

### Feature: Account Settings
**Priority**: P2 (Nice to have)  
**User Story**: As a user, I want to manage my account so I can update my phone or logout.

**Acceptance Criteria**:
- ✅ View phone number
- ✅ Logout
- ✅ Delete account (future)

**Schema Models**: `User`

**API Endpoints**:
```
GET  /auth/me
POST /auth/logout
```

**UI Screens**:
1. **Settings → Account**
   - Phone number (read-only)
   - "Logout" button
   - "Delete Account" (future)

**Offline Support**: Logout clears local data

---

## 3.5 Offline & Sync

### Feature: Offline-First Architecture
**Priority**: P0 (Critical)  
**User Story**: As a user, I want the app to work offline so I can create invoices anywhere.

**Acceptance Criteria**:
- ✅ All core features work offline
- ✅ Data synced when online
- ✅ Conflict resolution (server wins for issued invoices)
- ✅ Sync indicator visible
- ✅ Queue mutations for later sync

**Implementation**:
- **Local DB**: IndexedDB via Dexie
- **Sync Engine**: Background sync with retry
- **Outbox Pattern**: Queue mutations locally
- **Delta Sync**: Only sync changes since last sync

**Schema Models**: All models cached locally

**Offline Support**: Core feature

---

### Feature: Sync Status Indicator
**Priority**: P1 (Important)  
**User Story**: As a user, I want to know sync status so I understand if my data is backed up.

**Acceptance Criteria**:
- ✅ Indicator shows: Online, Offline, Syncing
- ✅ Last sync timestamp
- ✅ Manual sync trigger
- ✅ Sync error notifications

**UI Components**:
- Status badge in header/settings
- Sync icon with animation
- "Last synced: 2 minutes ago"
- "Sync Now" button

**Offline Support**: Core feature

---

## 3.6 Admin Features

### Feature: Super Admin Dashboard
**Priority**: P2 (Admin feature)  
**User Story**: As a super admin, I want to view platform metrics so I can monitor usage.

**Acceptance Criteria**:
- ✅ Total users
- ✅ Total businesses
- ✅ Total invoices issued
- ✅ Plan distribution
- ✅ Active users (daily/monthly)

**Schema Models**: All models

**API Endpoints**:
```
GET /admin/dashboard
```

**UI Screens** (Admin Portal):
1. **Admin Dashboard**
   - Metric cards
   - Charts
   - Recent activity

**Offline Support**: Not applicable

---

### Feature: User & Business Management
**Priority**: P2 (Admin feature)  
**User Story**: As a super admin, I want to manage users so I can provide support.

**Acceptance Criteria**:
- ✅ View all users/businesses
- ✅ Search by phone/business name
- ✅ View user details & invoices
- ✅ Suspend/activate accounts
- ✅ Change user plans

**Schema Models**: `User`, `Business`, `Subscription`

**API Endpoints**:
```
GET    /admin/users
GET    /admin/users/:id
PATCH  /admin/users/:id/status
PATCH  /admin/users/:id/plan
```

**UI Screens** (Admin Portal):
1. **User Management**
   - User list with search
   - User detail view
   - Actions: Suspend, Change Plan

**Offline Support**: Not applicable

---

# TECHNICAL IMPLEMENTATION DETAILS

## API Architecture

### REST API Endpoints Summary
```
# Auth
POST   /auth/request-otp
POST   /auth/verify-otp
GET    /auth/me
POST   /auth/logout

# Business
GET    /business/settings
PATCH  /business/settings
POST   /business/logo
POST   /business/signature

# Invoices
GET    /invoices
POST   /invoices
GET    /invoices/:id
PATCH  /invoices/:id
DELETE /invoices/:id
POST   /invoices/:id/issue
PATCH  /invoices/:id/status

# Customers
GET    /customers
POST   /customers
GET    /customers/:id
PATCH  /customers/:id
DELETE /customers/:id
GET    /customers/:id/invoices

# Products
GET    /products
POST   /products
GET    /products/:id
PATCH  /products/:id
DELETE /products/:id

# Templates
GET    /templates/base
GET    /templates/base/:id
GET    /templates/business
POST   /templates/business
GET    /templates/business/:id
PATCH  /templates/business/:id

# Reports
GET    /reports/dashboard
GET    /reports/invoices
GET    /reports/gst
GET    /reports/invoices/export

# Subscription
GET    /subscription/current
GET    /usage/current-month

# Admin (Super Admin only)
GET    /admin/dashboard
GET    /admin/users
GET    /admin/users/:id
PATCH  /admin/users/:id/status
PATCH  /admin/users/:id/plan
GET    /admin/plans
POST   /admin/plans
PATCH  /admin/plans/:id
GET    /admin/templates/base
POST   /admin/templates/base
PATCH  /admin/templates/base/:id
```

## Frontend Architecture

### Tech Stack
- **Framework**: React 18 + Vite
- **State**: Zustand (global) + TanStack Query (server state)
- **Routing**: React Router 6
- **Forms**: React Hook Form + Zod validation
- **Offline**: Dexie (IndexedDB wrapper)
- **PDF**: @react-pdf/renderer or Browser Print API
- **Mobile**: Capacitor 5
- **UI (mobile-first, low boilerplate)**: Ionic React (recommended) + optional Tailwind for custom styling
- **Icons**: Lucide React

### Folder Structure
```
app/src/
├── features/
│   ├── auth/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── api.js
│   │   └── routes.jsx
│   ├── invoices/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── api.js
│   │   ├── generatePDF.js
│   │   └── routes.jsx
│   ├── customers/
│   ├── products/
│   ├── templates/
│   ├── reports/
│   └── settings/
├── templates/
│   ├── registry.js
│   ├── CleanTemplate.jsx
│   └── ModernTemplate.jsx
├── offline/
│   ├── db.js (Dexie schema)
│   ├── sync.js (Sync engine)
│   └── outbox.js (Mutation queue)
├── lib/
│   ├── api.js (Axios instance)
│   ├── utils.js
│   └── constants.js
├── components/
│   └── ui/ (shadcn components)
├── hooks/
├── App.jsx
└── main.jsx
```

## Backend Architecture

### Tech Stack
- **Framework**: Fastify 4
- **ORM**: Prisma 5
- **Database**: PostgreSQL 15
- **Validation**: Zod
- **Auth**: JWT + OTP (via SMS provider)
- **Logging**: Pino
- **Testing**: Vitest

### Folder Structure
```
server/src/
├── features/
│   ├── auth/
│   │   ├── routes.js
│   │   ├── handlers.js
│   │   ├── service.js
│   │   └── validation.js
│   ├── invoices/
│   ├── customers/
│   ├── products/
│   ├── templates/
│   ├── reports/
│   └── admin/
├── common/
│   ├── config.js
│   ├── logger.js
│   ├── auth.js (JWT middleware)
│   └── errors.js
├── prisma/
│   ├── schema.prisma
│   ├── seed.js
│   └── migrations/
└── index.js
```

## Database Schema (Prisma)
- ✅ Already defined in `schema.prisma`
- ✅ Supports all features listed above
- ✅ Optimized indexes for performance
- ✅ Offline-sync ready (UUIDs, timestamps, idempotency)

---

# LLM-Friendly Build Rules (Do Not Skip)

## Build Invariants
- **Invoice PDF is generated on the client only**.
- **Issued invoices are immutable** (except status changes like Paid/Cancelled).
- **Template snapshot is mandatory on Issue** (`templateBaseId`, `templateConfigSnapshot`, `templateVersion`).
- **Drafts must never be lost** (autosave + recovery).
- **Progressive disclosure**: GST and advanced sections stay collapsed by default.
- **WhatsApp-first**: after PDF generation, primary CTA is WhatsApp share.

## App/Server Independence (Recap)
- The frontend must run as:
  - PWA in browser
  - Capacitor wrapper on Android/iOS
- The backend is a stateless JSON API.
- The only coupling is API contracts documented in this file.

## Schema → Feature Coverage Checklist (Exhaustive)

### Auth & Users
- **User**
  - OTP verification tracking (`otpVerifiedAt`).
  - Ownership of business workspace.
- **OtpRequest**
  - OTP issuance, expiry, attempts, verified.

### Business & Settings
- **Business**
  - Business profile: name, logo, phone/email/address.
  - GST settings: `gstEnabled`, `gstin`, `stateCode`.
  - Invoice defaults: prefix, next number, default notes/terms, default tax rate.
  - Template configs relation.
  - Plan/subscription linkage.
  - Payment details: bank/UPI fields.
  - Signature fields.

### Customers
- **Customer**
  - Minimal customer fields and search.
  - Soft delete behavior through invoices (`onDelete: SetNull`).

### Products/Services
- **ProductService**
  - Suggestions/autocomplete for line items.

### Invoices
- **Invoice**
  - Draft lifecycle and issuance.
  - Amounts: subtotal/discount/tax/total.
  - GST logic: `taxMode`, `taxRate`, `taxBreakup`, `placeOfSupplyStateCode`.
  - Snapshotting: `templateBaseId`, `templateConfigSnapshot`, `templateVersion`.
  - Status transitions + `issuedAt`.
- **InvoiceLineItem**
  - Qty default = 1.
  - Optional link to ProductService.

### Templates
- **BaseTemplate**
  - `configSchema` and `renderConfig` for client-side rendering.
  - `previewImageUrl` for template selection UI.
- **BusinessTemplateConfig**
  - Per business template config with versioning and active selection.

### Plans, Usage, Subscription
- **Plan**
  - Entitlements JSON includes monthly invoice limits and other future limits.
- **Subscription**
  - Tracks subscription state.
- **UsageCounter**
  - Monthly invoice issuance counter.

### Sync & Reliability
- **IdempotencyKey**
  - Prevent duplicate mutations on retries.

### Audit
- **AuditLog**
  - Store key mutations like issue, status changes, deletes.

---

# INVISIBLE UI PRINCIPLES APPLIED

## 1. Default-First
- ✅ Invoice date defaults to today
- ✅ Quantity defaults to 1
- ✅ Invoice number auto-incremented
- ✅ Business auto-created on signup
- ✅ Tax mode auto-determined from states

## 2. Progressive Disclosure
- ✅ Advanced invoice fields collapsed by default
- ✅ GST fields shown only when enabled
- ✅ Optional business setup skippable
- ✅ Customer address hidden by default

## 3. Auto-save & Reuse
- ✅ Customers auto-saved from invoices
- ✅ Products auto-saved from line items
- ✅ Drafts auto-saved every 2 seconds
- ✅ Typeahead suggestions from history

## 4. One Primary Action
- ✅ "New Invoice" always prominent (FAB)
- ✅ "Generate PDF" primary CTA on invoice
- ✅ "Share on WhatsApp" primary post-PDF action

## 5. Output-First
- ✅ User lands on "New Invoice" after signup (not settings)
- ✅ PDF generation is the goal (not just saving)
- ✅ WhatsApp share immediately after PDF

## 6. No Data Loss
- ✅ Continuous auto-save
- ✅ Draft recovery on relaunch
- ✅ Offline-first architecture
- ✅ Sync queue for mutations

---

# SUCCESS METRICS (V1)

## Critical Metrics
- ✅ **Time-to-first-PDF**: < 2 minutes from OTP verification
- ✅ **Invoice completion time**: < 60 seconds for returning users
- ✅ **Draft loss rate**: < 1% sessions
- ✅ **WhatsApp share completion**: > 80% of share attempts
- ✅ **PDF generation time**: < 2 seconds

## Business Metrics
- ✅ **User activation**: % users who issue ≥1 invoice in first week
- ✅ **Retention**: % users who return in week 2
- ✅ **Limit hit rate**: % free users who hit monthly limit
- ✅ **Upgrade conversion**: % users who upgrade after hitting limit

---

# READY FOR IMPLEMENTATION ✅

This feature definition covers:
- ✅ All PRD requirements
- ✅ All schema models utilized
- ✅ Invisible UI principles applied
- ✅ Clear implementation priority
- ✅ Technical architecture defined
- ✅ API endpoints specified
- ✅ UI screens detailed
- ✅ Offline support planned
- ✅ Success metrics defined

**Next Step**: Confirm and proceed to build the complete application, starting with Sprint 1 (MVP).
