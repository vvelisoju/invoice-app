-- AlterTable
ALTER TABLE "Subscription" ADD COLUMN     "autoRenew" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "billingPeriod" TEXT,
ADD COLUMN     "cancelledReason" TEXT;
