BEGIN;
-- Neon already carries some Feature 12 columns from an earlier schema push.
-- IF NOT EXISTS preserves that state while supporting a clean migration chain.
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "dodoCustomerId" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "user_dodoCustomerId_key" ON "user"("dodoCustomerId");
ALTER TABLE "subscription" ADD COLUMN IF NOT EXISTS "lastEventAt" TIMESTAMP(3);
ALTER TABLE "model_response" ADD COLUMN IF NOT EXISTS "usagePeriodId" TEXT;
CREATE INDEX IF NOT EXISTS "model_response_usagePeriodId_idx" ON "model_response"("usagePeriodId");
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'model_response_usagePeriodId_fkey') THEN
        ALTER TABLE "model_response" ADD CONSTRAINT "model_response_usagePeriodId_fkey"
            FOREIGN KEY ("usagePeriodId") REFERENCES "usage_period"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

-- Preserve the reservation window for existing metered responses. Gate failures
-- never reserved an answer. Free pre-metering rows have no matching usage period.
UPDATE "model_response" AS response
SET "usagePeriodId" = period."id"
FROM "turn" AS turn, "thread" AS thread, "usage_period" AS period
WHERE response."turnId" = turn."id" AND turn."threadId" = thread."id"
  AND period."userId" = thread."userId"
  AND period."scope" = CASE WHEN response."tier" = 'FREE'
      THEN 'DAILY'::"usage_scope" ELSE 'BILLING'::"usage_scope" END
  AND response."createdAt" >= period."periodStart"
  AND response."createdAt" < period."periodEnd"
  AND response."usagePeriodId" IS NULL
  AND (response."failure" IS NULL OR response."failure" NOT IN ('ALLOWANCE_SPENT', 'FREE_TIER_EXHAUSTED'));

CREATE TABLE IF NOT EXISTS "webhook_event" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "dodoSubscriptionId" TEXT,
    "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "webhook_event_pkey" PRIMARY KEY ("id")
);

UPDATE "subscription" AS subscription
SET "lastEventAt" = receipt."latest"
FROM (
    SELECT "dodoSubscriptionId", MAX("occurredAt") AS "latest"
    FROM "webhook_event" GROUP BY "dodoSubscriptionId"
) AS receipt
WHERE subscription."dodoSubscriptionId" = receipt."dodoSubscriptionId"
  AND subscription."lastEventAt" IS NULL;
COMMIT;
