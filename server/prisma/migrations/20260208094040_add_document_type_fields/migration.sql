-- AlterTable
ALTER TABLE "Business" ADD COLUMN     "documentTypeConfig" JSONB;

-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN     "documentType" TEXT NOT NULL DEFAULT 'invoice';
