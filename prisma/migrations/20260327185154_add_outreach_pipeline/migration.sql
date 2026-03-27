-- CreateEnum
CREATE TYPE "OutreachStatus" AS ENUM ('PROSPECT', 'CONTACTED', 'IN_CONVERSATION', 'PROPOSAL_SENT', 'WON', 'LOST');

-- CreateTable
CREATE TABLE "PropertyManager" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "companyName" TEXT NOT NULL,
    "contactName" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "website" TEXT,
    "propertyCount" INTEGER,
    "estimatedValue" DOUBLE PRECISION,
    "status" "OutreachStatus" NOT NULL DEFAULT 'PROSPECT',
    "lastContactedAt" TIMESTAMP(3),
    "nextFollowUpAt" TIMESTAMP(3),
    "notes" TEXT,

    CONSTRAINT "PropertyManager_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PropertyManager_status_idx" ON "PropertyManager"("status");
