-- AlterTable
ALTER TABLE "Reader" ADD COLUMN "className" TEXT;
ALTER TABLE "Reader" ADD COLUMN "parentPhone" TEXT;

-- CreateIndex
CREATE INDEX "Reader_parentPhone_idx" ON "Reader"("parentPhone");
