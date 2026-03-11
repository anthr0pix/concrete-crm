/*
  Warnings:

  - You are about to drop the column `pipelineStage` on the `Job` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Job" DROP COLUMN "pipelineStage";

-- DropEnum
DROP TYPE "PipelineStage";
