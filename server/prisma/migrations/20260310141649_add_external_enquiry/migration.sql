-- CreateTable
CREATE TABLE "ExternalEnquiry" (
    "id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "interestedIn" TEXT NOT NULL,
    "message" TEXT,
    "formType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'new',
    "notes" TEXT,
    "extraData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExternalEnquiry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ExternalEnquiry_source_idx" ON "ExternalEnquiry"("source");

-- CreateIndex
CREATE INDEX "ExternalEnquiry_status_idx" ON "ExternalEnquiry"("status");

-- CreateIndex
CREATE INDEX "ExternalEnquiry_createdAt_idx" ON "ExternalEnquiry"("createdAt");
