-- AlterTable
ALTER TABLE "InvoiceLineItem" ADD COLUMN     "taxRate" DECIMAL(5,2),
ADD COLUMN     "taxRateName" TEXT;
