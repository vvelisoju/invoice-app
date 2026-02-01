---
description: Initialize project context - understand architecture for development session
---

# Invoice App - Project Initialization Workflow

Run this workflow at the start of each development session to understand the project architecture and context.

## Step 1: Understand Project Overview

Read the following core documentation files:

- **PRD**: `d:\CodeVelWorkspce-New\Invoice-app\PRD-V1.md` - Product requirements and business logic
- **Technical Architecture**: `d:\CodeVelWorkspce-New\Invoice-app\TECHNICAL-ARCHITECTURE-V1.md` - System design and technology decisions
- **Features**: `d:\CodeVelWorkspce-New\Invoice-app\FEATURES.md` - Detailed feature specifications
- **Testing Guide**: `d:\CodeVelWorkspce-New\Invoice-app\TESTING-GUIDE.md` - Testing strategy and standards

**Key Project Context:**
- **Domain**: Indian GST-compliant invoicing app
- **Architecture**: Offline-first mobile app (React + Ionic + Capacitor)
- **Auth**: Phone OTP-based authentication
- **Database**: PostgreSQL with Prisma ORM + IndexedDB for offline storage
- **PDF Generation**: Client-side using @react-pdf/renderer with template customization

## Step 2: Understand Frontend Architecture

**Location**: `d:\CodeVelWorkspce-New\Invoice-app\app\`

### Frontend Tech Stack
- **Framework**: React 18 + Vite
- **UI**: Ionic React (mobile-first components)
- **Routing**: React Router v5 + Ionic React Router
- **State Management**: 
  - Zustand (global state: auth, sync status)
  - TanStack Query (server state, caching)
- **Forms**: React Hook Form + Zod validation
- **Offline Storage**: Dexie (IndexedDB wrapper)
- **Mobile**: Capacitor (iOS/Android native capabilities)

### Frontend Folder Structure
```
app/src/
├── features/          # Feature modules (auth, invoices, customers, etc.)
│   ├── auth/         # Phone OTP authentication
│   ├── invoices/     # Invoice CRUD, PDF generation
│   ├── home/         # Dashboard
│   ├── settings/     # Business settings
│   ├── templates/    # Template customization
│   └── reports/      # Reports and analytics
├── components/       # Shared UI components
├── store/           # Zustand stores (authStore, etc.)
├── lib/             # API client and utilities
├── db/              # IndexedDB schema (Dexie)
├── services/        # Business logic services
└── offline/         # Sync engine and outbox pattern
```

### Key Frontend Files to Review
- `app/src/App.jsx` - Main app routing and authentication flow
- `app/src/store/authStore.js` - Authentication state management
- `app/src/lib/api.js` - API client configuration
- `app/src/db/` - Offline database schema
- `app/package.json` - Dependencies and scripts

### Frontend Development Commands
```bash
cd app
npm run dev          # Start development server (Vite)
npm run build        # Build for production
npm run lint         # Run ESLint
npm run format       # Format code with Prettier
```

## Step 3: Understand Backend Architecture

**Location**: `d:\CodeVelWorkspce-New\Invoice-app\server\`

### Backend Tech Stack
- **Runtime**: Node.js (ES modules)
- **Framework**: Fastify (high-performance HTTP server)
- **ORM**: Prisma (PostgreSQL)
- **Validation**: Zod schemas
- **Auth**: JWT tokens (access + refresh)
- **Logging**: Pino (structured logging)
- **Security**: Helmet, CORS, Rate limiting

### Backend Folder Structure
```
server/src/
├── features/         # Feature modules (modular architecture)
│   ├── auth/        # OTP generation, verification, JWT
│   ├── business/    # Business settings and GST config
│   ├── customers/   # Customer management
│   ├── products/    # Products/services catalog
│   ├── invoices/    # Invoice CRUD, issuance, calculations
│   ├── templates/   # Base templates + business configs
│   ├── plans/       # Plan enforcement and usage tracking
│   ├── reports/     # Analytics and reports
│   └── sync/        # Offline sync and idempotency
├── common/          # Shared utilities
│   ├── config.js    # Environment configuration
│   ├── errors.js    # Error handling
│   ├── logger.js    # Pino logger setup
│   └── utils.js     # Helper functions
└── index.js         # Server entry point
```

### Key Backend Patterns
- **Controllers**: Thin layer handling HTTP requests/responses
- **Services**: Business logic and orchestration
- **Repositories**: Data access via Prisma
- **Middleware**: Auth, rate limiting, error handling
- **Idempotency**: Support for offline sync with idempotency keys

### Backend Development Commands
```bash
cd server
npm run dev          # Start with hot reload (--watch)
npm run start        # Production start
npm run db:generate  # Generate Prisma client
npm run db:migrate   # Run database migrations
npm run db:studio    # Open Prisma Studio (DB GUI)
npm run db:seed      # Seed database with initial data
npm run lint         # Run ESLint
npm run test         # Run tests with Vitest
```

## Step 4: Understand Database Schema

**Location**: `d:\CodeVelWorkspce-New\Invoice-app\server\prisma\schema.prisma`

### Core Database Models

**Authentication & Users**
- `User` - Phone-based user accounts
- `OtpRequest` - OTP generation and verification tracking

**Business Domain**
- `Business` - Business profile, GST settings, invoice defaults
- `Customer` - Customer records with GST details
- `ProductService` - Products/services catalog

**Invoicing Core**
- `Invoice` - Invoice header (status, amounts, GST breakup)
- `InvoiceLineItem` - Invoice line items
- **Invoice Status**: DRAFT → ISSUED → PAID/CANCELLED/VOID
- **Tax Modes**: NONE, IGST, CGST_SGST (invoice-level GST)

**Templates**
- `BaseTemplate` - System-wide template definitions (admin-managed)
- `BusinessTemplateConfig` - Per-business template customizations

**Plans & Usage**
- `Plan` - Subscription plans with entitlements (JSON)
- `Subscription` - Business subscription tracking
- `UsageCounter` - Monthly usage limits (invoices, customers, products)

**Sync & Audit**
- `IdempotencyKey` - Offline sync deduplication
- `AuditLog` - Change tracking for compliance

### Database Migrations
- Migrations are in `server/prisma/migrations/`
- Always run `npm run db:migrate` after pulling schema changes
- Use `npm run db:studio` to inspect data visually

## Step 5: Understand Key Business Rules

### GST Tax Logic (Invoice-Level)
- **IGST**: Inter-state transactions (business state ≠ customer state)
- **CGST + SGST**: Intra-state transactions (business state = customer state)
- Tax rate splits: IGST = full rate, CGST = SGST = rate/2
- Place of supply determines tax mode

### Invoice Lifecycle
1. **DRAFT**: Editable, stored locally (offline-first)
2. **ISSUED**: Immutable, template snapshot created, PDF generated
3. **PAID/CANCELLED/VOID**: Status updates only

### Plan Enforcement
- Free plan has monthly invoice limits (enforced at issuance)
- Usage counters track: invoices issued, customers, products
- Limits checked before generating PDF

### Offline-First Sync
- Client writes to IndexedDB immediately
- Outbox pattern queues mutations
- Sync engine pushes changes with idempotency keys
- Server is authoritative for invoice numbers and issuance

## Step 6: Understand Template System

### Two-Layer Architecture
1. **BaseTemplate**: System-defined templates (admin-controlled)
   - Contains `configSchema` (what can be customized)
   - Contains `renderConfig` (client-side rendering rules)
   
2. **BusinessTemplateConfig**: Per-business customizations
   - Validated against BaseTemplate's configSchema
   - Includes: colors, logo, layout options, field visibility

### Template Snapshotting
- When invoice is ISSUED, template config is frozen in `Invoice.templateConfigSnapshot`
- Ensures historical invoices render consistently even if template changes

### Client-Side PDF Generation
- Uses `@react-pdf/renderer` (React components → PDF)
- Template config + invoice data → PDF document
- No server-side PDF storage (generated on-demand)

## Step 7: Review Current Development Status

Check these files for project progress:
- `PHASE-1-PROGRESS.md` - Current development phase status
- `CLIENT-SIDE-PDF-GUIDE.md` - PDF generation implementation guide

## Step 8: Environment Setup Verification

### Frontend Environment
Check `app/.env`:
```
VITE_API_URL=http://localhost:3001
```

### Backend Environment
Check `server/.env`:
```
DATABASE_URL=postgresql://...
JWT_SECRET=...
OTP_PROVIDER=...
```

## Important Development Guidelines

### Code Style
- Use 2-space indentation
- Follow ESLint rules
- Run Prettier before committing
- No console.logs in production code (use logger)

### State Management Rules
- **Auth state**: Zustand authStore
- **Server data**: TanStack Query (caching, refetching)
- **Form state**: React Hook Form
- **Offline data**: Dexie (IndexedDB)

### API Communication
- All API calls go through `app/src/lib/api.js`
- Use TanStack Query mutations for writes
- Handle offline scenarios gracefully
- Include idempotency keys for sync operations

### Error Handling
- Frontend: Show user-friendly toast messages (IonToast)
- Backend: Use structured error responses
- Log errors with context (request ID, user ID, business ID)

### Testing Strategy
- Unit tests: Business logic and utilities
- Integration tests: API endpoints with test DB
- E2E tests: Critical user flows (Playwright)

## Workflow Complete

You now have full context of:
✅ Project architecture and technology stack
✅ Frontend structure (React + Ionic + offline-first)
✅ Backend structure (Fastify + Prisma + PostgreSQL)
✅ Database schema and relationships
✅ Business rules (GST, invoicing, plans)
✅ Template system and PDF generation
✅ Development commands and environment setup

**Ready to start development!** Always refer back to this context when making changes to ensure consistency with the architecture.
