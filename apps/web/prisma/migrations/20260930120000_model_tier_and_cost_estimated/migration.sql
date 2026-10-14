-- CreateEnum
CREATE TYPE "model_tier" AS ENUM ('FREE', 'STANDARD', 'ADVANCED', 'FRONTIER');

-- AlterTable
-- Both columns are additive and carry a default, so existing rows need no
-- backfill statement. FREE is the truthful value for every row that already
-- exists: before this migration the arena could only send free models.
ALTER TABLE "model_response" ADD COLUMN     "costEstimated" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "tier" "model_tier" NOT NULL DEFAULT 'FREE';
