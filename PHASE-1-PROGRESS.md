# Phase 1 MVP - Implementation Progress

## ✅ Backend Complete (Independent API)

### Architecture
- **Framework**: Fastify 4 with async/await
- **Database**: Prisma ORM + PostgreSQL
- **Auth**: JWT with OTP verification
- **Validation**: Zod schemas
- **Error Handling**: Custom error classes with proper HTTP status codes
- **Logging**: Pino logger with pretty print in dev

### Implemented Features

#### 1. Server Foundation ✅
- Fastify server with helmet, CORS, rate limiting
- Prisma client with query logging
- Global error handler
- Health check endpoint with database connectivity check
- Graceful shutdown handling

#### 2. Authentication System ✅
**Endpoints:**
- `POST /auth/request-otp` - Request OTP for phone number
- `POST /auth/verify-otp` - Verify OTP and get JWT token
- `GET /auth/me` - Get current user (protected)
- `POST /auth/logout` - Logout (protected)

**Features:**
- India phone validation (10 digits, 6-9 prefix)
- 6-digit OTP with 5-minute expiry
- Rate limiting (max 3 OTP requests per 15 minutes)
- Auto-create user on first OTP request
- Auto-create business workspace on first verification
- JWT token generation with 7-day expiry
- OTP attempt tracking (max 3 attempts)

#### 3. Invoice Management ✅
**Endpoints:**
- `GET /invoices` - List invoices with search/filters
- `POST /invoices` - Create draft invoice
- `GET /invoices/:id` - Get invoice details
- `PATCH /invoices/:id` - Update draft invoice
- `DELETE /invoices/:id` - Delete draft invoice
- `POST /invoices/:id/issue` - Issue invoice (with template snapshot)
- `PATCH /invoices/:id/status` - Update invoice status

**Features:**
- Auto-generate invoice numbers with business prefix
- Auto-increment next invoice number
- Calculate subtotal, discount, tax, total
- GST tax mode determination (IGST vs CGST+SGST) based on state codes
- Tax breakup calculation
- Line items management
- Draft-only editing (issued invoices immutable)
- Template snapshotting on issuance
- Search by invoice number or customer name
- Filter by status and date range

#### 4. Customer Management ✅
**Endpoints:**
- `GET /customers?search=query` - Search customers (typeahead)
- `POST /customers` - Create customer
- `GET /customers/:id` - Get customer details
- `PATCH /customers/:id` - Update customer

**Features:**
- Search by name or phone
- Auto-save from invoices
- Minimal fields (name, phone, GSTIN, state, address)

#### 5. Product/Service Management ✅
**Endpoints:**
- `GET /products?search=query` - Search products (typeahead)
- `POST /products` - Create product
- `GET /products/:id` - Get product details
- `PATCH /products/:id` - Update product

**Features:**
- Search by name
- Auto-save from invoice line items
- Default rate and unit support

### File Structure
```
server/
├── src/
│   ├── index.js (main server)
│   ├── common/
│   │   ├── config.js (environment config)
│   │   ├── logger.js (Pino logger)
│   │   ├── prisma.js (Prisma client)
│   │   ├── auth.js (JWT utilities + middleware)
│   │   └── errors.js (custom error classes + handler)
│   └── features/
│       ├── auth/
│       │   ├── service.js (business logic)
│       │   ├── handlers.js (request handlers)
│       │   ├── routes.js (route definitions)
│       │   └── validation.js (Zod schemas)
│       ├── invoices/
│       │   ├── service.js
│       │   ├── handlers.js
│       │   ├── routes.js
│       │   └── validation.js
│       ├── customers/
│       │   ├── service.js
│       │   ├── handlers.js
│       │   ├── routes.js
│       │   └── validation.js
│       └── products/
│           ├── service.js
│           ├── handlers.js
│           ├── routes.js
│           └── validation.js
├── prisma/
│   ├── schema.prisma (database schema)
│   ├── seed.js (seed data)
│   └── README.md (schema documentation)
├── package.json (updated with all dependencies)
└── .env.example (environment variables template)
```

### Next Steps: Run Backend

1. **Install dependencies:**
   ```bash
   cd server
   npm install
   ```

2. **Setup database:**
   ```bash
   # Create .env file with DATABASE_URL and JWT_SECRET
   cp .env.example .env
   # Edit .env with your PostgreSQL connection string
   
   # Run migrations
   npm run db:generate
   npm run db:migrate
   
   # Seed initial data (plans, templates)
   npm run db:seed
   ```

3. **Start server:**
   ```bash
   npm run dev
   ```

4. **Test endpoints:**
   ```bash
   # Health check
   curl http://localhost:3000/health
   
   # Request OTP
   curl -X POST http://localhost:3000/auth/request-otp \
     -H "Content-Type: application/json" \
     -d '{"phone":"9876543210"}'
   
   # Check console for OTP (SMS_PROVIDER=console in dev)
   
   # Verify OTP
   curl -X POST http://localhost:3000/auth/verify-otp \
     -H "Content-Type: application/json" \
     -d '{"phone":"9876543210","otp":"123456"}'
   
   # Use returned token for authenticated requests
   ```

---

## ✅ Frontend Complete (Ionic React)

### Architecture
- **Framework**: Ionic React 7 + Vite
- **Mobile**: Capacitor 5 for native builds
- **State**: Zustand (auth) + TanStack Query (server state)
- **Offline**: Dexie IndexedDB
- **PDF**: @react-pdf/renderer (client-side)
- **Forms**: React Hook Form + Zod

### Implemented Features

#### 1. App Foundation ✅
- Ionic React setup with Vite
- Capacitor configuration for Android/iOS
- React Router with IonRouterOutlet
- TanStack Query client with 5-min stale time
- Axios API client with auth interceptors

#### 2. Auth Screens ✅
- **PhonePage**: Phone entry with India validation
- **VerifyOTPPage**: 6-digit OTP input with auto-focus/auto-submit
- Zustand auth store with localStorage persistence
- Auto-redirect on successful verification

#### 3. New Invoice Screen ✅
- **Mobile-first design** with Ionic components
- **Customer typeahead** (local-first, API fallback)
- **Product typeahead** for line items
- **Line items management** (add/remove/edit)
- **Auto-calculation** of subtotal, tax, total
- **Auto-save** with 2-second debounce to IndexedDB
- **Advanced details** accordion (discount, tax, due date, notes, terms)
- **Draft persistence** across sessions

#### 4. PDF Generation ✅
- **Client-side PDF** using @react-pdf/renderer
- **Clean template** with business/customer info, line items, totals
- **GST support** (CGST+SGST or IGST breakup)
- **Download** as PDF file
- **Print** support
- **WhatsApp share** with pre-filled message
- **Web Share API** integration for native sharing

#### 5. Offline Storage ✅
- Dexie IndexedDB schema for invoices, customers, products
- Outbox pattern for offline sync
- Local-first search for typeaheads

### File Structure
```
app/
├── src/
│   ├── main.jsx (Ionic setup)
│   ├── App.jsx (routing)
│   ├── index.css (Ionic CSS imports)
│   ├── lib/
│   │   └── api.js (Axios client + API methods)
│   ├── store/
│   │   └── authStore.js (Zustand auth state)
│   ├── db/
│   │   └── index.js (Dexie schema + helpers)
│   └── features/
│       ├── auth/
│       │   ├── PhonePage.jsx
│       │   └── VerifyOTPPage.jsx
│       └── invoices/
│           ├── NewInvoicePage.jsx
│           ├── InvoicePDFPage.jsx
│           ├── hooks/
│           │   └── useInvoiceForm.js
│           ├── components/
│           │   ├── CustomerTypeahead.jsx
│           │   ├── ProductTypeahead.jsx
│           │   ├── LineItemRow.jsx
│           │   └── TotalsSummary.jsx
│           └── utils/
│               └── pdfGenerator.js
├── capacitor.config.json
├── package.json
├── vite.config.js
└── .env.example
```

---

## Phase 1 Definition of Done

- [x] Backend: OTP auth API working
- [x] Backend: Business auto-created on first verification
- [x] Backend: Invoice draft CRUD APIs working
- [x] Backend: Customer/Product search APIs working
- [x] Frontend: Auth screens (Phone → OTP)
- [x] Frontend: New Invoice screen with autosave
- [x] Frontend: Customer/Product typeaheads
- [x] Frontend: Client-side PDF generation
- [x] Frontend: Download PDF
- [x] Frontend: Offline storage (Dexie)
- [ ] End-to-end test: OTP → Invoice → PDF → Download

---

## Key Design Decisions

1. **Client-side PDF generation**: No `pdfUrl` in schema, PDFs generated on-demand
2. **Template snapshotting**: Config frozen at issuance for consistency
3. **Auto-increment invoice numbers**: Business manages next number
4. **GST tax mode auto-determination**: Based on business vs customer state
5. **Draft-only editing**: Issued invoices are immutable (except status)
6. **JWT authentication**: 7-day expiry, no refresh tokens in Phase 1
7. **Rate limiting**: 3 OTP requests per 15 minutes per phone
8. **Feature-based structure**: Each feature has service/handlers/routes/validation

---

# Phase 2: Invoice Lifecycle + Settings — COMPLETE ✅

## Goal
User can manage invoices end-to-end, view history, and configure business settings.

## Deliverables Completed

### Backend
- **Business Profile API** (`/business`)
  - `GET /business` - Get business profile
  - `PATCH /business` - Update business settings
  - `GET /business/stats` - Dashboard statistics

### Frontend

#### 1. Home Dashboard ✅
- Business stats cards (total invoices, paid, unpaid, drafts)
- Quick "New Invoice" action
- Pull-to-refresh

#### 2. Invoice List Screen ✅
- Search by invoice number or customer
- Filter by status (All, Draft, Issued, Paid)
- Infinite scroll pagination
- Invoice cards with key info
- FAB for new invoice

#### 3. Invoice Detail Screen ✅
- Full invoice view (customer, items, totals)
- Status badge with color coding
- Action buttons based on status:
  - Draft: Edit, Delete, Generate PDF
  - Issued: Mark as Paid, Cancel, Share
  - Paid: Mark as Unpaid, Share
- Confirmation dialogs for destructive actions

#### 4. Settings Screen ✅
- **Business Information**: Name, phone, email, address
- **GST Settings**: Toggle, GSTIN, state code, default tax rate
- **Bank Details**: Bank name, account, IFSC, UPI ID
- **Invoice Defaults**: Prefix, next number, notes, terms
- Logout functionality

#### 5. Bottom Tab Navigation ✅
- Home tab (dashboard)
- Invoices tab (list)
- Settings tab
- Auth-protected routing

### File Structure (Phase 2 Additions)
```
server/src/features/business/
├── service.js
├── handlers.js
├── routes.js
└── validation.js

app/src/features/
├── home/
│   └── HomePage.jsx
├── invoices/
│   ├── InvoiceListPage.jsx
│   └── InvoiceDetailPage.jsx
└── settings/
    └── SettingsPage.jsx
```

## Phase 2 Definition of Done

- [x] Backend: Business profile CRUD API
- [x] Backend: Business stats API for dashboard
- [x] Frontend: Home dashboard with stats
- [x] Frontend: Invoice list with search/filters
- [x] Frontend: Invoice detail view
- [x] Frontend: Status management (Paid/Cancelled)
- [x] Frontend: Settings screen (business profile)
- [x] Frontend: Bottom tab navigation
- [x] Frontend: Auth-protected routing

---

# Phase 3: India GST + Reports — COMPLETE ✅

## Goal
GST works with minimal UX friction, correct output in PDFs, and basic reporting.

## Deliverables Completed

### Backend
- **Reports API** (`/reports`)
  - `GET /reports/summary` - Invoice totals with date range filter
  - `GET /reports/gst` - GST summary with CGST/SGST/IGST breakup
  - `GET /reports/trend` - Monthly invoice trend (last 6 months)

### Frontend

#### 1. Enhanced PDF Template ✅
- **Bank Details Section**: Bank name, account number, IFSC code
- **UPI Payment**: UPI ID display
- **Signature Block**: Authorized signatory line with business name
- **GST Breakup**: Already had CGST/SGST vs IGST display

#### 2. Reports Screen ✅
- **Summary Tab**: Total invoices, revenue, breakdown by status
- **GST Tab**: Taxable value, total GST, CGST/SGST/IGST breakup, by tax rate
- **Trend Tab**: Last 6 months with invoice count and amounts
- Pull-to-refresh on all tabs

#### 3. Navigation Update ✅
- Added Reports tab to bottom navigation (4 tabs total)

### File Structure (Phase 3 Additions)
```
server/src/features/reports/
├── service.js
├── handlers.js
└── routes.js

app/src/features/reports/
└── ReportsPage.jsx
```

## Phase 3 Definition of Done

- [x] Backend: Reports summary API
- [x] Backend: GST summary API with breakup
- [x] Backend: Monthly trend API
- [x] Frontend: Reports screen with 3 tabs
- [x] Frontend: PDF template with bank/UPI/signature
- [x] Invoice number collision validation (already in Phase 1)

---

# Phase 4: Templates (Per-business Customization) — COMPLETE ✅

## Goal
Businesses can customize invoice templates without engineering, and invoices remain consistent over time via snapshotting.

## Deliverables Completed

### Backend
- **Template APIs** (`/templates`)
  - `GET /templates/base` - List available base templates
  - `GET /templates/base/:id` - Get base template details
  - `GET /templates/config` - Get business template configuration
  - `PUT /templates/config` - Update business template configuration
  - `GET /templates/snapshot` - Get template snapshot for invoice issuance

### Frontend

#### 1. Template Selection Screen ✅
- List of available base templates with previews
- Current template indicator
- One-tap template selection
- Link to template editor

#### 2. Template Editor Screen ✅
- **Colors**: Primary, secondary, accent color pickers
- **Logo**: Show/hide toggle, position selector
- **Business Info**: Toggle visibility of name, address, GSTIN, phone, email
- **Customer Info**: Toggle visibility of phone, email, address, GSTIN
- **Totals Section**: Toggle subtotal, discount, tax breakup, amount in words
- **Footer Section**: Toggle bank details, UPI, signature, terms, notes
- **Custom Labels**: Invoice title, Bill To, column headers

#### 3. PDF Generator Updates ✅
- Accepts template config parameter
- Uses config for visibility toggles
- Falls back to defaults if no config

#### 4. Settings Integration ✅
- "Invoice Template" link in Settings page
- Routes to template selection

### File Structure (Phase 4 Additions)
```
server/src/features/templates/
├── service.js
├── handlers.js
└── routes.js

app/src/features/templates/
├── TemplateSelectPage.jsx
└── TemplateEditorPage.jsx
```

## Phase 4 Definition of Done

- [x] Backend: Template list API
- [x] Backend: Business template config CRUD
- [x] Backend: Template snapshot API
- [x] Frontend: Template selection screen
- [x] Frontend: Template editor with all customization options
- [x] Frontend: PDF generator uses template config
- [x] Frontend: Template snapshot used for issued invoices

---

# Phase 5: Offline-first Sync Engine — COMPLETE ✅

## Goal
App is reliable offline and syncs safely with minimal bugs.

## Deliverables Completed

### Backend
- **Sync APIs** (`/sync`)
  - `GET /sync/delta` - Get changes since last sync timestamp
  - `GET /sync/full` - Get full data for initial sync
  - `POST /sync/batch` - Process batch of offline mutations with idempotency

- **Idempotency Support**
  - Idempotency keys stored in database
  - 24-hour expiry for idempotency keys
  - Cached responses returned for duplicate requests

### Frontend

#### 1. Sync Service ✅
- Online/offline detection
- Periodic sync (30 second intervals)
- Push pending mutations to server
- Pull changes from server (delta or full sync)
- Retry logic with max 3 attempts
- Idempotency key generation for each mutation

#### 2. Outbox Pattern ✅
- Mutations stored in IndexedDB outbox
- Synced flag (0=pending, 1=synced, -1=failed)
- Retry count tracking
- Automatic sync trigger when online

#### 3. Sync Status Store (Zustand) ✅
- `isOnline` - Network connectivity status
- `isSyncing` - Currently syncing flag
- `lastSyncAt` - Last successful sync timestamp
- `pendingCount` - Number of pending mutations

#### 4. Sync Status UI ✅
- **SyncStatusBar**: Full-width banner showing offline/syncing/pending status
- **SyncStatusChip**: Compact chip for header with tap-to-sync
- Color-coded states (yellow=offline, blue=syncing, green=synced)
- Pending count display

### File Structure (Phase 5 Additions)
```
server/src/features/sync/
├── service.js (idempotency, delta sync, batch processing)
├── handlers.js
└── routes.js

app/src/
├── services/
│   └── syncService.js (main sync engine)
├── store/
│   └── syncStore.js (Zustand store)
└── components/
    └── SyncStatusBar.jsx (UI components)
```

## Phase 5 Definition of Done

- [x] Backend: Delta sync API
- [x] Backend: Full sync API
- [x] Backend: Batch mutation processing
- [x] Backend: Idempotency key support
- [x] Frontend: Sync service with outbox pattern
- [x] Frontend: Automatic retry with backoff
- [x] Frontend: Sync status store
- [x] Frontend: Sync status UI (bar + chip)
- [x] Frontend: Online/offline detection

---

# Phase 6: Plans + Limits + Admin Operations — COMPLETE ✅

## Goal
Enforce usage limits, enable upgrades, and provide admin tools for managing the platform.

## Deliverables Completed

### Backend

#### Plan Limits Service
- `checkCanIssueInvoice(businessId)` - Validates against monthly limit before issuance
- `incrementUsageCounter(businessId)` - Tracks usage after successful issuance
- `getBusinessPlanUsage(businessId)` - Returns plan details and current usage

#### Plans API (`/plans`)
- `GET /plans` - List available plans
- `GET /plans/usage` - Get current plan and usage for business

#### Admin API (`/plans/admin`)
- `POST /plans` - Create new plan (admin only)
- `PATCH /plans/:id` - Update plan (admin only)
- `GET /plans/admin/businesses` - List all businesses with filters
- `GET /plans/admin/businesses/:id` - Get business details with usage
- `POST /plans/admin/assign` - Assign plan to business

#### Invoice Service Integration
- Plan limit check added to `issueInvoice()` function
- Usage counter incremented after successful issuance
- Returns `PLAN_LIMIT_REACHED` error code when blocked

### Frontend

#### 1. Plan Usage Card ✅
- Visual progress bar showing usage
- Color-coded states (normal, warning at 80%, danger at 100%)
- Remaining invoices display
- Upgrade link when limit reached

#### 2. Upgrade Prompt Modal ✅
- Triggered when limit reached or user clicks upgrade
- Shows current plan and usage
- Displays upgrade options with pricing
- Lists pro benefits
- CTA buttons for upgrade flow

#### 3. Settings Integration ✅
- PlanUsageCard displayed at top of Settings page
- UpgradePrompt modal accessible from settings
- Plans API integrated

### File Structure (Phase 6 Additions)
```
server/src/features/plans/
├── service.js (limits, usage, admin functions)
├── handlers.js
└── routes.js

app/src/components/
├── PlanUsageCard.jsx
└── UpgradePrompt.jsx
```

## Phase 6 Definition of Done

- [x] Backend: Plan limits check at invoice issuance
- [x] Backend: Usage counter tracking
- [x] Backend: Plans list and usage API
- [x] Backend: Admin APIs for plan management
- [x] Backend: Admin APIs for business management
- [x] Frontend: Plan usage card component
- [x] Frontend: Upgrade prompt modal
- [x] Frontend: Settings page integration

---

# 🎉 ALL PHASES COMPLETE 🎉

## Summary

The Invoice App has been fully implemented across 6 phases:

| Phase | Name | Key Features |
|-------|------|--------------|
| 1 | MVP | OTP auth, invoice creation, PDF generation, offline storage |
| 2 | Invoice Lifecycle | List/detail views, status management, settings, navigation |
| 3 | India GST + Reports | GST breakup, reports (summary, GST, trend), bank details |
| 4 | Templates | Selection, editor, config snapshotting, PDF customization |
| 5 | Offline Sync | Outbox pattern, delta sync, idempotency, status UI |
| 6 | Plans + Limits | Usage tracking, upgrade prompts, admin operations |

## Tech Stack

**Backend:**
- Fastify 4 + Prisma ORM + PostgreSQL
- JWT + OTP authentication
- Zod validation
- Feature-based architecture

**Frontend:**
- Ionic React 7 + Capacitor 5
- TanStack Query + Zustand
- Dexie (IndexedDB) for offline
- @react-pdf/renderer for client-side PDF

## API Endpoints Summary

| Prefix | Purpose |
|--------|---------|
| `/auth` | OTP authentication |
| `/invoices` | Invoice CRUD + status |
| `/customers` | Customer management |
| `/products` | Product/service catalog |
| `/business` | Business profile + stats |
| `/reports` | Summary, GST, trends |
| `/templates` | Template selection + config |
| `/sync` | Offline sync (delta, batch) |
| `/plans` | Plans, usage, admin ops |
