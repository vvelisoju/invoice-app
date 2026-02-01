# Prisma Schema Documentation

## Overview
This schema is designed for a **mobile-first, offline-capable invoice application** targeting small businesses in India with GST support.

## Key Design Decisions

### 1. UUID Primary Keys
- All entities use UUIDs for client-side generation (offline-first)
- Enables conflict-free sync between client and server

### 2. Invoice-Level GST (V1)
- `taxMode`: NONE, IGST, or CGST_SGST
- `taxRate`: single percentage applied to invoice subtotal
- `taxBreakup`: JSON field stores calculated amounts
- Place of supply determined by business and customer state codes

### 3. Template Customization (Two-Layer) - Client-Side Rendering
- **BaseTemplate**: Platform-managed templates with `renderConfig` (React component definitions, styles, layout)
- **BusinessTemplateConfig**: Per-business customization within schema bounds
- **Template Snapshotting**: Invoice stores `templateConfigSnapshot` at issuance for immutability
- **PDF Generation**: Client-side on-demand using browser's print API or PDF libraries (jsPDF, react-pdf)

### 4. Plan Enforcement
- **Plan.entitlements**: JSON field for flexible limit definitions
- **UsageCounter**: Tracks monthly usage per business (invoicesIssuedCount, etc.)
- **monthKey format**: "YYYY-MM" for efficient querying

### 5. Offline Sync Support
- `updatedAt` timestamps on all mutable entities
- **IdempotencyKey**: Prevents duplicate mutations from retry
- Indexes on `businessId + updatedAt` for delta sync queries

### 6. Invoice Immutability & Client-Side PDF
- Once `status = ISSUED`, invoice data should be immutable (except status changes)
- `invoiceNumber` is unique per business (enforced at DB level)
- Template snapshot locked at issuance (enables consistent PDF regeneration)
- **No server PDF storage**: PDFs generated on-demand by client using invoice data + template snapshot
- Benefits: No storage costs, always fresh rendering, works offline after sync

## Critical Indexes

### Performance
- `Customer`: `(businessId, name)`, `(businessId, phone)`, `(businessId, updatedAt)`
- `Invoice`: `(businessId, invoiceNumber)` unique, `(businessId, status)`, `(businessId, date)`
- `UsageCounter`: `(businessId, monthKey)` unique

### Sync
- All business-owned entities indexed on `(businessId, updatedAt)`

## Relationships

### Cascading Deletes
- User deleted → Businesses deleted → All business data deleted
- Business deleted → Customers, Products, Invoices, Templates deleted
- Invoice deleted → LineItems deleted

### Soft References
- Invoice → Customer: `onDelete: SetNull` (preserve invoice if customer deleted)
- LineItem → ProductService: `onDelete: SetNull` (preserve line item if product deleted)

## Usage Patterns

### Creating an Invoice (Client-Side PDF)
1. Client creates draft with UUID (stored in IndexedDB)
2. Sync pushes to server with idempotency key
3. User issues invoice → server enforces plan limit and snapshots template config
4. Client generates PDF on-demand using snapshotted template
5. PDF can be regenerated anytime from invoice data + template snapshot (no server storage)

### Plan Limit Check (Monthly Invoices)
```sql
SELECT invoicesIssuedCount 
FROM UsageCounter 
WHERE businessId = ? AND monthKey = ?
```
Compare with `Plan.entitlements.monthlyInvoicesLimit`

### Delta Sync Query
```sql
SELECT * FROM Invoice 
WHERE businessId = ? AND updatedAt > ?
ORDER BY updatedAt ASC
LIMIT 100
```

## Migrations

### Initial Setup
```bash
cd server
npm run db:generate
npm run db:migrate
npm run db:seed
```

### Adding Migrations
```bash
npx prisma migrate dev --name descriptive_name
```

## Future Considerations (V2+)

### Item-Level GST
Add to `InvoiceLineItem`:
- `hsnCode`, `sacCode`
- `taxRate`, `taxAmount`
Aggregate to invoice-level breakup

### Multi-User Teams
Add `BusinessUser` join table:
- `businessId`, `userId`, `role`
- Separate from platform Super Admin

### Payment Integration
Add to `Invoice`:
- `paymentMethod`, `paymentTransactionId`
- `paidAt`, `paidAmount`

### Recurring Invoices
New `RecurringInvoice` model:
- `frequency`, `nextIssueDate`
- Links to template invoice
