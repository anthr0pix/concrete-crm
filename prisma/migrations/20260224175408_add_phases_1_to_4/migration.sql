-- CreateEnum
CREATE TYPE "DepositType" AS ENUM ('FIXED', 'PERCENTAGE');

-- CreateEnum
CREATE TYPE "PipelineStage" AS ENUM ('NEW', 'CONTACTED', 'QUOTE_SENT', 'FOLLOW_UP', 'WON', 'LOST');

-- CreateEnum
CREATE TYPE "ExpenseCategory" AS ENUM ('MATERIALS', 'FUEL', 'EQUIPMENT', 'LABOR', 'INSURANCE', 'MARKETING', 'OFFICE', 'OTHER');

-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN     "squareOrderId" TEXT,
ADD COLUMN     "squarePaymentId" TEXT;

-- AlterTable
ALTER TABLE "Job" ADD COLUMN     "crewAssignment" TEXT,
ADD COLUMN     "laborHours" DOUBLE PRECISION,
ADD COLUMN     "laborRate" DOUBLE PRECISION,
ADD COLUMN     "materialCost" DOUBLE PRECISION,
ADD COLUMN     "pipelineStage" "PipelineStage",
ADD COLUMN     "resealDueDate" TIMESTAMP(3),
ADD COLUMN     "resealReminderSentAt" TIMESTAMP(3),
ADD COLUMN     "reviewRequestSentAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Quote" ADD COLUMN     "depositAmount" DOUBLE PRECISION,
ADD COLUMN     "depositPaid" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "depositPaidAt" TIMESTAMP(3),
ADD COLUMN     "depositType" "DepositType",
ADD COLUMN     "followUpCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "lastFollowUpAt" TIMESTAMP(3),
ADD COLUMN     "squareDepositPaymentId" TEXT;

-- CreateTable
CREATE TABLE "PaymentEvent" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "invoiceId" TEXT,
    "quoteId" TEXT,
    "squarePaymentId" TEXT,
    "squareOrderId" TEXT,
    "eventType" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" TEXT NOT NULL,
    "metadata" JSONB,

    CONSTRAINT "PaymentEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppSettings" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "reviewDelayDays" INTEGER NOT NULL DEFAULT 1,
    "reviewRequestEnabled" BOOLEAN NOT NULL DEFAULT true,
    "googleReviewUrl" TEXT,
    "resealReminderMonths" INTEGER NOT NULL DEFAULT 24,
    "resealReminderEnabled" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "AppSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Expense" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "category" "ExpenseCategory" NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "vendor" TEXT,
    "receiptUrl" TEXT,
    "jobId" TEXT,
    "notes" TEXT,

    CONSTRAINT "Expense_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PaymentEvent_invoiceId_idx" ON "PaymentEvent"("invoiceId");

-- CreateIndex
CREATE INDEX "PaymentEvent_quoteId_idx" ON "PaymentEvent"("quoteId");

-- CreateIndex
CREATE INDEX "PaymentEvent_squarePaymentId_idx" ON "PaymentEvent"("squarePaymentId");

-- CreateIndex
CREATE INDEX "Expense_date_idx" ON "Expense"("date");

-- CreateIndex
CREATE INDEX "Expense_category_idx" ON "Expense"("category");

-- CreateIndex
CREATE INDEX "Expense_jobId_idx" ON "Expense"("jobId");

-- AddForeignKey
ALTER TABLE "PaymentEvent" ADD CONSTRAINT "PaymentEvent_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentEvent" ADD CONSTRAINT "PaymentEvent_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE SET NULL ON UPDATE CASCADE;
