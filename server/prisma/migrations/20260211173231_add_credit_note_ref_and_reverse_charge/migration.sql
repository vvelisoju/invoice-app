-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN     "originalInvoiceId" TEXT,
ADD COLUMN     "reverseCharge" BOOLEAN NOT NULL DEFAULT false;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_originalInvoiceId_fkey" FOREIGN KEY ("originalInvoiceId") REFERENCES "Invoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;
