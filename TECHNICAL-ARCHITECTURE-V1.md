# Technical Architecture Document (V1) — Invoice App
**Version:** 1.0  
**Region:** India (GST)  
**Auth:** Phone OTP  
**Clients:** Web (PWA) + Mobile Apps (Capacitor)  
**Backend:** Node.js + Prisma + PostgreSQL  

---

## 1) Objectives
- Build a **mobile-first** invoicing experience with **offline-first** draft creation.
- Support **GST invoice-level tax** (IGST vs CGST/SGST) with minimal input.
- Enable **PDF generation** using **per-business template customization** and **immutable invoice snapshots**.
- Provide **WhatsApp-first sharing** plus download/print.
- Keep the platform **plan-ready** (free plan monthly invoice limits, premium upgrades later).
- Follow a **standard, maintainable architecture** with clear layering and module boundaries.

---

## 2) High-level System Architecture

### 2.1 Components
- **Client Apps**
  - **React Web App (PWA)** for browser-based use
  - **Capacitor Mobile App** wrapping the same React build for Android/iOS
- **Backend API**
  - Node.js service containing business logic, authentication, plan enforcement, PDF generation pipeline
- **Database**
  - PostgreSQL (source of truth)
- **Object Storage**
  - Stores generated PDFs (S3-compatible recommended)
- **SMS Provider**
  - Sends OTPs
- **Observability**
  - Logs + metrics + error reporting

### 2.2 Core Architectural Decisions
- **Offline-first via local DB + sync engine** (client), with **server authoritative issuance**.
- **Server-side PDF rendering** for consistent templates and reliable output.
- **Template snapshotting on invoice issue** ensures historic invoices never change.
- **Plan enforcement on invoice issuance** (Generate PDF step) to reduce user frustration.

---

## 3) Technology Stack (Proposed Standard)

## 3.1 Frontend (Web + Mobile via Capacitor)
**Framework & Build**
- React (JavaScript)
- Vite
- React Router

**State/Data**
- TanStack Query (server cache + request state) *(optional but recommended)*
- Zustand (small global state: auth session, sync status, plan usage, UI flags)

**Forms & Validation**
- React Hook Form
- Zod for schema validation (shared between UI and domain logic)

**UI System**
- TailwindCSS
- Component library: shadcn/ui (built on Radix) *(keeps UI consistent, fast to build)*

**Offline Storage**
- IndexedDB via Dexie

**PWA & Offline**
- Service worker via `vite-plugin-pwa`
- Caching strategy: cache-first app shell, network-first data with local DB fallback

**Mobile Packaging**
- Capacitor (Android + iOS)
- Capacitor plugins:
  - Share (for WhatsApp share sheet)
  - Filesystem (save PDF)
  - Network (connectivity status)
  - App/Browser (open PDF links)

**PDF Handling on Client**
- Download PDF from server and:
  - Share via OS share sheet (WhatsApp)
  - Save locally (downloads / filesystem)
  - Print (open PDF in viewer -> print)

---

## 3.2 Backend (Node.js + Prisma)
**Runtime & Framework**
- Node.js (LTS)
- Fastify *(recommended for performance + schema-first patterns)*
  - Alternative: Express (acceptable if team familiarity is higher)

**ORM & DB**
- Prisma ORM
- PostgreSQL

**Validation**
- Zod (or TypeBox if leaning into Fastify JSON schema)

**Auth & Security**
- OTP via SMS provider
- Session strategy:
  - JWT access token + refresh token (or opaque sessions)
- Rate limiting for OTP endpoints
- Idempotency keys for sync and critical writes

**PDF Generation**
- Headless Chromium (Playwright/Chrome) rendering HTML templates to PDF
- Template rendering engine: server-side HTML template (e.g., Handlebars/EJS) + controlled config schema

**Storage**
- S3-compatible object storage for PDFs (AWS S3 / Cloudflare R2 / MinIO)

**Observability**
- Logging: Pino
- Metrics: OpenTelemetry + Prometheus (or vendor equivalent)
- Error reporting: Sentry

---

## 4) Standard Folder Architecture

## 4.1 Frontend (`app/`) Suggested Structure
- `src/`
  - `ui/` (pages, components, navigation)
  - `features/` (feature modules: invoices, customers, products, templates, settings)
  - `domain/` (pure business rules: totals, gst)
  - `data/` (repositories: local + remote, mapping)
  - `offline/` (indexeddb schema, outbox, sync engine)
  - `api/` (http client wrapper)
  - `state/` (global state)
  - `pwa/` (service worker registration, update prompt)

**Principle:** UI never directly calls the server; UI uses feature services/use-cases which call repositories.

## 4.2 Backend (`server/`) Suggested Structure
- `src/`
  - `modules/`
    - `auth/` (OTP, sessions)
    - `business/` (settings, gst toggle)
    - `customers/`
    - `products/`
    - `invoices/` (draft, issue)
    - `templates/` (base templates + business configs)
    - `plans/` (entitlements + usage)
    - `reports/`
    - `sync/` (idempotent writes + delta reads)
  - `common/` (config, errors, logger, utils)
  - `middleware/` (auth, rate limit, request-id)
- `prisma/`
  - `schema.prisma`
  - `migrations/`

**Principle:** controllers are thin; business logic is in services; DB logic is via repositories/Prisma.

---

## 5) Offline-First Architecture (Client)

### 5.1 Local-First Writes
- All edits (invoice draft, customers, products, template config) write to IndexedDB immediately.
- Each mutation also creates an **outbox** record.

### 5.2 Sync Engine (Outbox Pattern)
- Triggers:
  - app start
  - connectivity regained
  - periodic background sync (best effort)
- Phases:
  - **Push:** send queued outbox mutations in order with idempotency keys
  - **Pull:** fetch server deltas since last cursor
  - **Reconcile:** apply updates to local DB

### 5.3 Conflict Handling (V1)
- Draft entities: last-write-wins using server `updatedAt` as authoritative.
- Templates: versioned updates (optimistic concurrency).
- Issued invoices: immutable (except status updates).

### 5.4 Offline Constraint for Issuance
- Invoice issuance (Generate PDF) requires connectivity.
- If offline:
  - allow save draft
  - show Connect to issue invoice

---

## 6) Core Domain Services (Backend)

### 6.1 Invoice Issuance Service (Authoritative)
Responsibilities:
- Validate invoice draft completeness
- Enforce **monthly invoice limit** for free plan
- Compute/verify totals and GST breakup (invoice-level)
- Snapshot template config into the invoice record
- Generate PDF and store to object storage

### 6.2 Template Service
Responsibilities:
- Maintain base templates (Super Admin controlled)
- Validate business template configs against a schema
- Provide render model for PDF generation
- Ensure snapshotting on issuance

### 6.3 Plan & Usage Service
Responsibilities:
- Evaluate entitlements (monthly invoice limit, templates count, premium features)
- Track usage counters per business per month
- Guardrail all create/issue operations

---

## 7) Data Model Standards (Prisma + Postgres)

### 7.1 Key Entities (Conceptual)
- User (phone-based)
- Business (ownerUserId, stateCode, gstEnabled, gstin, plan)
- Customer (minimal fields)
- ProductService
- Invoice + InvoiceLineItem
- BaseTemplate + BusinessTemplateConfig
- Subscription/Plan + UsageCounter

### 7.2 Non-negotiable Invariants
- Invoice number unique per business.
- Issued invoice is immutable (except status toggles).
- Issued invoice stores template snapshot.
- Usage increments atomically at issuance.

---

## 8) Capacitor Mobile App Architecture

### 8.1 Strategy
- Build once (React) and ship as:
  - PWA
  - Capacitor Android
  - Capacitor iOS

### 8.2 Why Capacitor
- Access native share sheet (WhatsApp-friendly)
- Better file saving control (filesystem)
- Improved reliability over pure browser downloads on some devices

### 8.3 Native Capabilities Needed (V1)
- **Share:** share generated PDF via WhatsApp and other apps
- **Filesystem:** store PDF to device
- **Network:** detect offline/online
- Optional later:
  - Push notifications (invoice reminders)

### 8.4 Release/Distribution (Standard)
- Android: Play Store (AAB)
- iOS: App Store
- Use environment-based builds for staging/prod

---

## 9) Quality & Engineering Standards

### 9.1 Frontend
- Linting: ESLint
- Formatting: Prettier
- Unit tests: Vitest
- Component/integration tests: React Testing Library
- E2E (critical flows): Playwright

### 9.2 Backend
- Unit tests: Vitest/Jest
- Integration tests: supertest-style + test DB
- Migrations: Prisma migrations in CI

### 9.3 CI/CD (Recommended)
- PR checks:
  - lint
  - tests
  - build
- Deploy:
  - server deploy to staging then prod
  - app deploy to CDN hosting

---

## 10) Security, Compliance, and Observability

### 10.1 Security
- OTP throttling + device fingerprinting (basic)
- Rate limiting and abuse detection
- Strict businessId-based authorization
- Encryption at rest (server-side)

### 10.2 Observability
- Structured logs with request IDs
- Metrics:
  - OTP success/failure
  - PDF generation time
  - issuance success/failures
  - sync backlog size
- Error reporting:
  - Frontend + backend Sentry

---

## 11) Recommended V1 Build Phases (Technical)
1. Foundation: repo split, base modules, auth, local DB, sync skeleton
2. Invoicing core: draft create/edit, autosave, customers/products suggestions
3. Issuance: plan enforcement + template snapshot + server PDF
4. Output: WhatsApp share/download/print (web + capacitor)
5. Template editor: per-business config + preview + validation
6. Hardening: testing, observability, rate limits, performance tuning

---

## 12) Open Parameters (Need Final Numbers)
- Free plan monthly invoice limit (e.g., 10/20/30)
- Free vs premium template customization depth (which toggles/features are premium)
- PDF generation infrastructure sizing expectations (expected invoices/day)

---
**Document Status:** Final technical architecture (V1) aligned with PRD decisions and offline-first + Capacitor requirements.
