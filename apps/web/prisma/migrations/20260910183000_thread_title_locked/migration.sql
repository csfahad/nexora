ALTER TABLE "thread" ADD COLUMN "titleLocked" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX "thread_userId_updatedAt_idx" ON "thread"("userId", "updatedAt");
