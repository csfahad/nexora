-- AlterTable
ALTER TABLE "thread" ADD COLUMN     "shareSlug" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "thread_shareSlug_key" ON "thread"("shareSlug");
