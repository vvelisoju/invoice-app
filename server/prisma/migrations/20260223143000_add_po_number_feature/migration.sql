-- AlterTable: Add enablePoNumber to Business (default false)
ALTER TABLE "Business" ADD COLUMN IF NOT EXISTS "enablePoNumber" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable: Add poNumber to Customer
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "poNumber" TEXT;
