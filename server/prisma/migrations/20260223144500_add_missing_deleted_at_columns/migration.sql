-- AlterTable: Add deletedAt to Customer (soft delete support)
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);

-- AlterTable: Add deletedAt to ProductService (soft delete support)
ALTER TABLE "ProductService" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);
