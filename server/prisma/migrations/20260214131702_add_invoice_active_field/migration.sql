-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN     "active" BOOLEAN NOT NULL DEFAULT true;

-- CreateIndex
CREATE INDEX "Invoice_businessId_active_idx" ON "Invoice"("businessId", "active");
