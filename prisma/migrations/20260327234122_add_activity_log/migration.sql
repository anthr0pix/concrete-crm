-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('EMAIL_SENT', 'STATUS_CHANGED', 'NOTE_ADDED', 'PAYMENT_RECEIVED', 'PHOTO_UPLOADED', 'JOB_CREATED', 'QUOTE_CREATED', 'INVOICE_CREATED', 'QUOTE_APPROVED', 'QUOTE_DECLINED', 'QUOTE_CHANGES_REQUESTED', 'FOLLOW_UP_SENT', 'REVIEW_REQUEST_SENT', 'RESEAL_REMINDER_SENT', 'DEPOSIT_RECEIVED');

-- CreateTable
CREATE TABLE "Activity" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" "ActivityType" NOT NULL,
    "customerId" TEXT NOT NULL,
    "jobId" TEXT,
    "quoteId" TEXT,
    "invoiceId" TEXT,
    "description" TEXT NOT NULL,
    "metadata" JSONB,

    CONSTRAINT "Activity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Activity_customerId_idx" ON "Activity"("customerId");

-- CreateIndex
CREATE INDEX "Activity_jobId_idx" ON "Activity"("jobId");

-- CreateIndex
CREATE INDEX "Activity_quoteId_idx" ON "Activity"("quoteId");

-- CreateIndex
CREATE INDEX "Activity_invoiceId_idx" ON "Activity"("invoiceId");

-- CreateIndex
CREATE INDEX "Activity_createdAt_idx" ON "Activity"("createdAt");

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;
