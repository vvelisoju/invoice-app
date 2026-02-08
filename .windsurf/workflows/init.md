---
description: Initialize project context - understand architecture for development session
---

# Invoice App — Session Init

Run this at the start of every Cascade session. Read the files listed in each step, then internalize the architecture summary that follows.

---

## Step 1: Read Core Documentation

Read these files (skim for context, don't memorize line-by-line):

1. `d:\CodeVelWorkspce-New\Invoice-app\PRD-V1.md` — Product requirements, user personas, business rules
2. `d:\CodeVelWorkspce-New\Invoice-app\TECHNICAL-ARCHITECTURE-V1.md` — System design decisions
3. `d:\CodeVelWorkspce-New\Invoice-app\FEATURES.md` — Detailed feature specs
4. `d:\CodeVelWorkspce-New\Invoice-app\PHASE-1-PROGRESS.md` — Current development status & what's done/pending

---

## Step 2: Read Key Frontend Files

Read these files to understand the frontend architecture:

1. `d:\CodeVelWorkspce-New\Invoice-app\app\package.json` — Dependencies & scripts
2. `d:\CodeVelWorkspce-New\Invoice-app\app\src\App.jsx` — Routing, auth gate, page imports
3. `d:\CodeVelWorkspce-New\Invoice-app\app\src\store\authStore.js` — Auth state (Zustand + persist)
4. `d:\CodeVelWorkspce-New\Invoice-app\app\src\lib\api.js` — Axios client, all API modules (auth, invoice, customer, product, business, reports, template, sync, plans, taxRate)
5. `d:\CodeVelWorkspce-New\Invoice-app\app\src\components\layout\AppLayout.jsx` — Shell layout (desktop sidebar + mobile bottom nav)
6. `d:\CodeVelWorkspce-New\Invoice-app\app\src\components\layout\navigationConfig.js` — Header tabs, invoice types, sidebar config
7. `d:\CodeVelWorkspce-New\Invoice-app\app\src\index.css` — TailwindCSS v4 theme tokens, safe-area utilities, mobile CSS
8. `d:\CodeVelWorkspce-New\Invoice-app\app\src\config\branding.js` — App branding constants
9. `d:\CodeVelWorkspce-New\Invoice-app\app\capacitor.config.json` — Capacitor native config

---

## Step 3: Read Key Backend Files

Read these files to understand the backend architecture:

1. `d:\CodeVelWorkspce-New\Invoice-app\server\package.json` — Dependencies & scripts
2. `d:\CodeVelWorkspce-New\Invoice-app\server\src\index.js` — Fastify server setup, plugin registration, all route imports
3. `d:\CodeVelWorkspce-New\Invoice-app\server\src\common\config.js` — Environment config (DB, JWT, SMS, GCS, Razorpay)
4. `d:\CodeVelWorkspce-New\Invoice-app\server\src\common\errors.js` — Error handler
5. `d:\CodeVelWorkspce-New\Invoice-app\server\src\common\auth.js` — JWT auth middleware
6. `d:\CodeVelWorkspce-New\Invoice-app\server\src\common\storage.js` — Google Cloud Storage helper (logo uploads)

---

## Step 4: Read Database Schema

Read this file completely — it is the source of truth for all data models:

1. `d:\CodeVelWorkspce-New\Invoice-app\server\prisma\schema.prisma` — All models, enums, relations, indexes

---

## Architecture Summary (Internalize After Reading)

### Project Identity
- **Product**: "Simple Invoice" — Indian GST-compliant invoicing app
- **Target**: Small businesses in India needing professional invoices
- **Monorepo**: `app/` (frontend) + `server/` (backend) at project root

### Frontend Stack
| Layer | Technology |
|---|---|
| **Framework** | React 18 + Vite 5 |
| **Styling** | TailwindCSS v4 (`@import "tailwindcss"` + `@theme` block in `index.css`) |
| **Icons** | Lucide React |
| **Routing** | React Router v5 (`react-router-dom` v5.3.4) |
| **State** | Zustand 4 (auth, sync) + TanStack Query 5 (server data) |
| **Forms** | React Hook Form 7 + Zod 3 |
| **HTTP** | Axios (centralized in `lib/api.js`) |
| **Offline DB** | Dexie 4 (IndexedDB wrapper) |
| **PDF** | `@react-pdf/renderer` 3 (client-side generation) |
| **Mobile** | Capacitor 5 (iOS/Android) |
| **Date** | date-fns 3 |

### Frontend Folder Map
```
app/src/
├── App.jsx                    # Root: auth gate → LandingPage/AuthenticatedApp
├── main.jsx                   # React DOM entry
├── index.css                  # TailwindCSS v4 theme + global styles
├── ErrorBoundary.jsx          # Global error boundary
├── config/
│   └── branding.js            # App name, tagline, feature flags
├── store/
│   ├── authStore.js           # Zustand: user, business, token (persisted)
│   └── syncStore.js           # Zustand: sync status tracking
├── lib/
│   └── api.js                 # Axios instance + all API modules
├── db/
│   └── index.js               # Dexie IndexedDB schema
├── services/
│   └── syncService.js         # Offline sync engine (outbox pattern)
├── offline/
│   └── db.js                  # Offline DB helpers
├── pages/
│   ├── LandingPage.jsx        # Public marketing page
│   └── DemoPage.jsx           # Interactive demo
├── features/
│   ├── auth/                  # PhonePage, VerifyOTPPage
│   ├── home/                  # HomePage (dashboard)
│   ├── invoices/              # InvoiceListPage, InvoiceDetailPage, NewInvoicePage, InvoicePDFPage
│   │   ├── components/        # CustomerTypeahead, ProductTypeahead, LineItemRow, TemplateSelectModal, TotalsSummary
│   │   ├── hooks/             # useInvoiceForm (form logic)
│   │   └── utils/templates/   # pdfTemplates.jsx (48KB — all PDF template components), registry.js
│   ├── customers/             # CustomerListPage, CustomerDetailPage
│   ├── products/              # ProductListPage, ProductDetailPage
│   ├── settings/              # SettingsPage (business profile, bank, signature)
│   ├── templates/             # TemplateSelectPage, TemplateEditorPage
│   ├── reports/               # ReportsPage (summary, GST, trends)
│   └── plans/                 # PlansPage (subscription management)
├── components/
│   ├── layout/                # AppLayout, AppHeader, AppSidebar, PageHeader, navigationConfig
│   ├── invoice-form/          # InvoiceFormPage, InvoiceHeaderSection, InvoiceLineItems, InvoiceTotalsFooter, etc.
│   ├── invoice/               # AdvancedInvoiceForm, BasicInvoiceForm, TaxModal
│   ├── data-table/            # DataTable (card-based mobile), PageToolbar, StatusFilterPills, CheckboxFilter, TableSummary
│   ├── landing/               # HeroSection, FeaturesSection, PricingSection, TemplatesSection, FAQSection, etc.
│   ├── customers/             # CreateCustomerModal
│   ├── demo/                  # RegistrationModal
│   ├── AppModal.jsx           # Reusable modal component
│   ├── PlanLimitModal.jsx     # Plan limit exceeded modal
│   ├── PlanUsageCard.jsx      # Usage display card
│   ├── SyncStatusBar.jsx      # Offline sync indicator
│   └── UpgradePrompt.jsx      # Upgrade CTA component
```

### Frontend Routes
**Public (unauthenticated):**
- `/` → LandingPage
- `/demo` → DemoPage
- `/auth/phone` → PhonePage
- `/auth/verify` → VerifyOTPPage

**Authenticated (wrapped in AppLayout):**
- `/home` → HomePage (dashboard)
- `/invoices` → InvoiceListPage
- `/invoices/new` → NewInvoicePage
- `/invoices/:id` → InvoiceDetailPage
- `/customers` → CustomerListPage
- `/products` → ProductListPage
- `/settings` → SettingsPage
- `/plans` → PlansPage
- `/reports` → ReportsPage
- `/templates` → TemplateSelectPage
- `/templates/editor` → TemplateEditorPage

### Backend Stack
| Layer | Technology |
|---|---|
| **Runtime** | Node.js (ES modules) |
| **Framework** | Fastify 4 |
| **ORM** | Prisma 5 + PostgreSQL |
| **Auth** | JWT (jsonwebtoken) — 7-day expiry |
| **Validation** | Zod 3 |
| **Logging** | Pino + pino-pretty |
| **Security** | @fastify/helmet, @fastify/cors, @fastify/rate-limit (100/min) |
| **File Upload** | @fastify/multipart (5MB limit) |
| **Storage** | Google Cloud Storage (logo uploads) |
| **SMS** | SpringEdge (OTP in production), console (dev) |
| **Payments** | Razorpay (plan subscriptions) |

### Backend Folder Map
```
server/src/
├── index.js                   # Fastify setup, plugin registration, route mounting
├── common/
│   ├── config.js              # dotenv config (DB, JWT, SMS, GCS, Razorpay)
│   ├── auth.js                # JWT verification middleware
│   ├── errors.js              # Centralized error handler
│   ├── logger.js              # Pino logger
│   ├── prisma.js              # Prisma client singleton
│   ├── storage.js             # GCS upload/delete helpers
│   └── razorpay.js            # Razorpay client instance
├── features/
│   ├── auth/                  # routes, handlers, service, validation — Phone OTP + JWT
│   ├── business/              # routes, handlers, service, validation — Business profile, logo upload
│   ├── customers/             # routes, handlers, service, validation — CRUD
│   ├── products/              # routes, handlers, service, validation — CRUD + units
│   ├── invoices/              # routes, handlers, service, validation — CRUD, issue, status
│   ├── tax-rates/             # routes, handlers, service, validation — Per-business tax rates
│   ├── templates/             # routes, handlers, service — Base templates + business configs
│   ├── plans/                 # routes, handlers, service — Plans, subscriptions, Razorpay
│   ├── reports/               # routes, handlers, service — Summary, GST, trends
│   └── sync/                  # routes, handlers, service — Delta sync, full sync, batch mutations
```

**Each feature module follows**: `routes.js` → `handlers.js` → `service.js` (+ optional `validation.js`)

### Backend Route Prefixes
| Module | Prefix | Notes |
|---|---|---|
| auth | `/auth/*` | No prefix in register |
| invoices | `/invoices/*` | No prefix in register |
| customers | `/customers/*` | No prefix in register |
| products | `/products/*` | No prefix in register |
| business | `/business` | Prefixed |
| reports | `/reports` | Prefixed |
| templates | `/templates` | Prefixed |
| sync | `/sync` | Prefixed |
| plans | `/plans` | Prefixed |
| tax-rates | `/tax-rates` | Prefixed |
| health | `/health` | Inline in index.js |

### Database Models (Prisma)
| Group | Models |
|---|---|
| **Auth** | `User` (phone-based), `OtpRequest` |
| **Business** | `Business` (profile, GST, bank, signature, invoice defaults, enabledInvoiceTypes) |
| **Catalog** | `Customer`, `ProductService`, `TaxRate` |
| **Invoicing** | `Invoice` (status: DRAFT→ISSUED→PAID/CANCELLED/VOID), `InvoiceLineItem` |
| **Templates** | `BaseTemplate` (configSchema + renderConfig), `BusinessTemplateConfig` (per-business overrides) |
| **Plans** | `Plan` (entitlements JSON), `Subscription` (Razorpay), `UsageCounter` (monthly limits) |
| **Sync** | `IdempotencyKey` |
| **Audit** | `AuditLog` |

**Key enums**: `InvoiceStatus` (DRAFT, ISSUED, PAID, CANCELLED, VOID), `TaxMode` (NONE, IGST, CGST_SGST), `SubscriptionStatus` (ACTIVE, PAST_DUE, CANCELLED, EXPIRED)

### GST Tax Logic
- **Invoice-level tax** (not line-item level in V1)
- **IGST**: Business state ≠ customer state → full rate as IGST
- **CGST+SGST**: Business state = customer state → rate/2 each
- `placeOfSupplyStateCode` on Invoice determines tax mode
- Tax breakup stored as JSON in `Invoice.taxBreakup`

### Invoice Lifecycle
1. **DRAFT** — Editable, no invoice number lock
2. **ISSUED** — Immutable, template config snapshotted into `templateConfigSnapshot`, `issuedAt` set
3. **PAID / CANCELLED / VOID** — Status-only transitions

### Invoice Types
12 configurable types per business (stored in `Business.enabledInvoiceTypes` JSON):
`invoice`, `tax_invoice`, `proforma`, `receipt`, `sales_receipt`, `cash_receipt`, `quote`, `estimate`, `credit_memo`, `credit_note`, `purchase_order`, `delivery_note`

### Template System
- **Two-layer**: `BaseTemplate` (admin-defined schema + render config) → `BusinessTemplateConfig` (per-business customization)
- **Snapshotting**: On invoice issuance, config frozen in `Invoice.templateConfigSnapshot`
- **Client-side PDF**: `@react-pdf/renderer` components in `features/invoices/utils/templates/pdfTemplates.jsx`
- **Template registry**: `features/invoices/utils/templates/registry.js`

### Offline-First Architecture
- **Client writes** to Dexie (IndexedDB) immediately
- **Outbox pattern** in `services/syncService.js` queues mutations
- **Sync engine** pushes changes with idempotency keys
- **Server authoritative** for invoice numbers and issuance
- **Sync store** (`store/syncStore.js`) tracks sync status

### Mobile-First UI Patterns
- **Layout**: Desktop = Header + Sidebar + Content; Mobile = Header + Content + Bottom Nav (5 items)
- **Responsive**: `md:` breakpoint for desktop, mobile-first defaults
- **Touch**: 44px min tap targets, `active:` instead of `hover:`, `tap-target-auto` escape class
- **Safe areas**: CSS `env(safe-area-inset-*)` utilities (`.safe-top`, `.safe-bottom`, `.safe-x`)
- **DataTable**: Card-based layout on mobile via `renderMobileCard` prop
- **Scrollbars**: Hidden on mobile, thin on desktop
- **Capacitor**: StatusBar overlay, Keyboard resize, iOS contentInset

### Design Tokens (TailwindCSS v4)
Defined in `index.css` `@theme` block:
- **Primary**: `#2563EB` (blue-600), hover `#1D4ED8`
- **Backgrounds**: `bgPrimary: #F9FAFB`, `bgSecondary: #FFFFFF`
- **Text**: `textPrimary: #111827`, `textSecondary: #6B7280`
- **Border**: `#E5E7EB`, light `#F3F4F6`
- **Font**: Inter, sans-serif
- **Shadows**: `soft`, `card`

### Environment Variables
**Frontend** (`app/.env`): `VITE_API_URL` (default: `http://localhost:3000`)

**Backend** (`server/.env`): `DATABASE_URL`, `JWT_SECRET` (required), plus optional: `PORT`, `CORS_ORIGIN`, `SMS_PROVIDER`, `SPRING_EDGE_API_KEY_ID`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `GCS_BUCKET`, `GOOGLE_CLOUD_SERVICE_ACCOUNT_KEY`

### Development Commands

**Frontend** (cwd: `app/`):
- `npm run dev` — Vite dev server (default port 5173)
- `npm run build` — Production build to `dist/`
- `npm run lint` — ESLint
- `npm run format` — Prettier

**Backend** (cwd: `server/`):
- `npm run dev` — Node.js with `--watch` flag
- `npm run start` — Production start
- `npm run db:generate` — Generate Prisma client
- `npm run db:migrate` — Run migrations
- `npm run db:studio` — Prisma Studio GUI
- `npm run db:seed` — Seed initial data (plans, templates)
- `npm run test` — Vitest

### Code Conventions
- **Indentation**: 2 spaces
- **Modules**: ES modules (`"type": "module"` in both package.json)
- **Styling**: TailwindCSS utility classes, no CSS-in-JS
- **Icons**: Lucide React (not Ionicons for app UI)
- **Modals**: Use `AppModal.jsx` wrapper
- **State**: Zustand for auth/sync, TanStack Query for server data, React Hook Form for forms
- **API calls**: Always through `lib/api.js` modules, never raw axios
- **Backend pattern**: routes → handlers → service (thin handlers, business logic in services)
- **Validation**: Zod schemas in both frontend (forms) and backend (request validation)
- **Error handling**: Frontend shows toast/modal; Backend uses structured errors via `common/errors.js`

---

## Workflow Complete

After reading the files above, you have full context of:
- Project architecture, tech stack, and folder structure
- All frontend routes, components, and state management
- All backend API modules and database models
- Business rules (GST, invoicing, plans, templates)
- Mobile-first UI patterns and design tokens
- Development commands and environment setup

**Ready for development.**
