# Invoice Baba - Backend Server

## Tech Stack
- **Runtime**: Node.js (LTS)
- **Framework**: Fastify
- **ORM**: Prisma
- **Database**: PostgreSQL
- **Auth**: JWT + Phone OTP

## Project Structure
```
server/
├── prisma/
│   ├── schema.prisma       # Database schema
│   ├── migrations/         # Migration history
│   ├── seed.js            # Seed data (plans, templates)
│   └── README.md          # Schema documentation
├── src/
│   ├── modules/           # Feature modules
│   │   ├── auth/
│   │   ├── business/
│   │   ├── customers/
│   │   ├── products/
│   │   ├── invoices/
│   │   ├── templates/
│   │   ├── plans/
│   │   ├── reports/
│   │   └── sync/
│   ├── common/            # Shared utilities
│   │   ├── config.js
│   │   ├── logger.js
│   │   └── errors.js
│   ├── middleware/        # Request middleware
│   └── index.js          # App entry point
└── package.json
```

## Getting Started

### Prerequisites
- Node.js 18+ LTS
- PostgreSQL 14+
- npm or yarn

### Installation
```bash
cd server
npm install
```

### Environment Setup
```bash
cp .env.example .env
# Edit .env with your configuration
```

### Database Setup
```bash
# Generate Prisma Client
npm run db:generate

# Run migrations
npm run db:migrate

# Seed initial data (plans, templates)
npm run db:seed
```

### Development
```bash
npm run dev
```
Server will start on http://localhost:3000 with hot reload

### Database Management
```bash
# Open Prisma Studio (GUI)
npm run db:studio

# Create new migration
npx prisma migrate dev --name migration_name

# Reset database (WARNING: deletes all data)
npx prisma migrate reset
```

## Key Features

### 1. OTP Authentication
- Phone-based registration
- Rate-limited OTP requests
- JWT session tokens

### 2. Invoice Issuance Pipeline
- Draft creation (offline-sync compatible)
- Plan limit enforcement
- Template snapshot on issue
- Server-side PDF generation

### 3. GST Support (India)
- Invoice-level tax calculation
- IGST vs CGST/SGST determination
- State-based place of supply

### 4. Template Customization
- Base templates (platform-managed)
- Per-business configuration
- Validation against schema
- Immutable snapshots

### 5. Plan & Usage Enforcement
- Monthly invoice limits
- Customer/product limits
- Template access control
- Usage tracking per business

### 6. Offline Sync
- Idempotent mutations
- Delta sync endpoints
- Conflict resolution (last-write-wins)

## API Standards (To Be Implemented)
- RESTful endpoints
- Request validation with Zod
- Structured error responses
- Request ID tracking
- Rate limiting

## Testing
```bash
npm test
```

## Production Deployment
```bash
# Build (if using TypeScript later)
npm run build

# Start production server
npm start
```

## Environment Variables
See `.env.example` for all required configuration.

Critical variables:
- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: Secret for signing tokens
- `SMS_PROVIDER_API_KEY`: OTP delivery
- `PDF_STORAGE_*`: Object storage for PDFs

## Monitoring & Observability
- Structured logging with Pino
- Request/response logging
- Error tracking (integrate Sentry)
- Performance metrics (to be added)
