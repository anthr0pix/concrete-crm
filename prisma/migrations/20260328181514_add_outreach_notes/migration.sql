-- CreateTable
CREATE TABLE "OutreachNote" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "propertyManagerId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "content" TEXT NOT NULL,

    CONSTRAINT "OutreachNote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OutreachNote_propertyManagerId_createdAt_idx" ON "OutreachNote"("propertyManagerId", "createdAt");

-- AddForeignKey
ALTER TABLE "OutreachNote" ADD CONSTRAINT "OutreachNote_propertyManagerId_fkey" FOREIGN KEY ("propertyManagerId") REFERENCES "PropertyManager"("id") ON DELETE CASCADE ON UPDATE CASCADE;
