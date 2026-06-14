-- Add serviceType column as nullable so we can backfill before enforcing NOT NULL.
ALTER TABLE "Quote" ADD COLUMN "serviceType" "ServiceType";

-- Backfill: inherit from the linked Job where one exists.
UPDATE "Quote" q
SET "serviceType" = j."serviceType"
FROM "Job" j
WHERE q."jobId" = j.id AND q."serviceType" IS NULL;

-- Backfill: remaining rows (quotes with no linked Job) default to CONCRETE_SEALING.
UPDATE "Quote" SET "serviceType" = 'CONCRETE_SEALING' WHERE "serviceType" IS NULL;

-- Enforce NOT NULL and set the column default for new inserts.
ALTER TABLE "Quote" ALTER COLUMN "serviceType" SET NOT NULL;
ALTER TABLE "Quote" ALTER COLUMN "serviceType" SET DEFAULT 'CONCRETE_SEALING';
