-- CreateEnum
CREATE TYPE "plan" AS ENUM ('FREE', 'PRO', 'PRO_PLUS', 'MAX');

-- CreateEnum
CREATE TYPE "billing_interval" AS ENUM ('MONTHLY', 'ANNUAL');

-- CreateEnum
CREATE TYPE "subscription_status" AS ENUM ('ACTIVE', 'PAST_DUE', 'ON_HOLD', 'CANCELLED', 'EXPIRED', 'FAILED');

-- CreateEnum
CREATE TYPE "usage_scope" AS ENUM ('DAILY', 'BILLING');

-- CreateTable
CREATE TABLE "subscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "plan" "plan" NOT NULL,
    "interval" "billing_interval" NOT NULL,
    "status" "subscription_status" NOT NULL,
    "dodoSubscriptionId" TEXT NOT NULL,
    "currentPeriodStart" TIMESTAMP(3) NOT NULL,
    "currentPeriodEnd" TIMESTAMP(3) NOT NULL,
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "pastDueEndsAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usage_period" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "scope" "usage_scope" NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "freeAnswers" INTEGER NOT NULL DEFAULT 0,
    "standard" INTEGER NOT NULL DEFAULT 0,
    "advanced" INTEGER NOT NULL DEFAULT 0,
    "frontier" INTEGER NOT NULL DEFAULT 0,
    "spentUsd" DECIMAL(12,6) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usage_period_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "subscription_userId_key" ON "subscription"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "subscription_dodoSubscriptionId_key" ON "subscription"("dodoSubscriptionId");

-- CreateIndex
CREATE INDEX "usage_period_userId_scope_idx" ON "usage_period"("userId", "scope");

-- CreateIndex
-- The gate reads and writes exactly one row per (user, scope, window), and this
-- is what makes the reserve inside runStartTurn's transaction race-free.
CREATE UNIQUE INDEX "usage_period_userId_scope_periodStart_key" ON "usage_period"("userId", "scope", "periodStart");

-- AddForeignKey
ALTER TABLE "subscription" ADD CONSTRAINT "subscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usage_period" ADD CONSTRAINT "usage_period_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
