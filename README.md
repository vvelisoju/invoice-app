# Invoice Baba — Billing Made Easy

A **mobile-first, offline-capable invoice application** for small businesses in India with GST support.

## 📋 Project Overview

### Purpose
Fast invoice generation with minimal data entry, designed for business owners who need to create and share invoices on-the-go via mobile devices.

### Key Features
- ⚡ **Fast onboarding** (OTP-based, < 2 minutes to first invoice)
- 📱 **Mobile-first** (PWA + Capacitor for Android/iOS)
- 🔄 **Offline-first** (create drafts without connectivity)
- 🇮🇳 **GST-ready** (invoice-level tax with IGST/CGST/SGST)
- 📄 **PDF generation** with per-business template customization
- 💬 **WhatsApp sharing** (primary output method)
- 📊 **Plan-based limits** (free plan with upgrade path)

## 🏗️ Architecture

### Monorepo Structure
```
Invoice-app/
├── app/              # React + Vite frontend (PWA + Capacitor)
├── server/           # Node.js + Fastify + Prisma backend
├── docs/             # Documentation
├── PRD-V1.md         # Product Requirements Document
└── TECHNICAL-ARCHITECTURE-V1.md
```

### Tech Stack

#### Frontend (`app/`)
- React 18 + Vite
- JavaScript
- TailwindCSS + shadcn/ui
- Zustand + TanStack Query
- IndexedDB (Dexie) for offline storage
- Capacitor for mobile apps

#### Backend (`server/`)
- Node.js + Fastify
- Prisma ORM
- PostgreSQL
- JWT authentication
- Server-side PDF generation

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ LTS
- PostgreSQL 14+
- npm or yarn

### Installation

#### 1. Clone and Install Dependencies
```bash
# Install frontend dependencies
cd app
npm install

# Install backend dependencies
cd ../server
npm install
```

#### 2. Setup Backend
```bash
cd server

# Copy environment file
cp .env.example .env
# Edit .env with your database and API keys

# Setup database
npm run db:generate
npm run db:migrate
npm run db:seed
```

#### 3. Start Development Servers
```bash
# Terminal 1 - Backend
cd server
npm run dev

# Terminal 2 - Frontend
cd app
npm run dev
```

- Frontend: http://localhost:5173
- Backend: http://localhost:3000
- Prisma Studio: `npm run db:studio` (in server/)

## 📚 Documentation

- **[PRD-V1.md](./PRD-V1.md)** - Product Requirements Document
- **[TECHNICAL-ARCHITECTURE-V1.md](./TECHNICAL-ARCHITECTURE-V1.md)** - Technical Architecture
- **[server/prisma/README.md](./server/prisma/README.md)** - Database Schema Documentation
- **[app/README.md](./app/README.md)** - Frontend Documentation
- **[server/README.md](./server/README.md)** - Backend Documentation

## 🗄️ Database Schema Highlights

### Core Entities
- **User** (phone-based OTP auth)
- **Business** (settings, GST config, plan)
- **Customer** (minimal fields, GST optional)
- **ProductService** (for suggestions)
- **Invoice** + **InvoiceLineItem** (with GST breakup)
- **BaseTemplate** + **BusinessTemplateConfig** (two-layer customization)
- **Plan** + **Subscription** + **UsageCounter** (limit enforcement)

### Key Features
- UUID primary keys (offline-sync friendly)
- Invoice-level GST (V1 simplification)
- Template snapshotting (immutable invoices)
- Monthly usage tracking
- Idempotency support

## 🎯 V1 Scope

### Included
- OTP authentication
- Invoice CRUD with offline drafts
- Customer/product auto-save from invoices
- GST invoice-level tax (IGST/CGST/SGST)
- PDF generation with template customization
- WhatsApp share + download + print
- Free plan with monthly invoice limits
- Basic reports

### Not Included (Future)
- Item-level GST
- Payment collection (UPI/Stripe)
- Multi-user teams
- Inventory management
- GSTR filing exports

## 🧪 Testing

```bash
# Frontend tests
cd app
npm test

# Backend tests
cd server
npm test
```

## 📱 Mobile App (Capacitor)

```bash
cd app

# Add platforms
npx cap add android
npx cap add ios

# Build and sync
npm run build
npx cap sync

# Open in native IDE
npx cap open android
npx cap open ios
```

## 🚢 Deployment

### Frontend
- Build: `npm run build` in `app/`
- Deploy to: Vercel, Netlify, Cloudflare Pages
- Configure environment variables

### Backend
- Deploy to: Railway, Render, AWS, DigitalOcean
- Setup PostgreSQL database
- Configure environment variables
- Setup object storage for PDFs (S3-compatible)

## 📊 Monitoring & Observability

- Structured logging (Pino)
- Error tracking (Sentry recommended)
- Performance metrics (to be added)
- Usage analytics (to be added)

## 🤝 Contributing

This is a V1 MVP. Future contributions should:
- Follow the established architecture
- Add tests for new features
- Update documentation
- Consider offline-first principles

## 📄 License

[Your License Here]

## 🙋 Support

For questions or issues, refer to the documentation or create an issue in the repository.

---

**Status**: V1 Architecture Complete - Ready for Implementation
