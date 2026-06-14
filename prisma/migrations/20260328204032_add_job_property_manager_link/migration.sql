-- AlterTable
ALTER TABLE "Job" ADD COLUMN     "propertyManagerId" TEXT;

-- CreateIndex
CREATE INDEX "Job_propertyManagerId_idx" ON "Job"("propertyManagerId");

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_propertyManagerId_fkey" FOREIGN KEY ("propertyManagerId") REFERENCES "PropertyManager"("id") ON DELETE SET NULL ON UPDATE CASCADE;
