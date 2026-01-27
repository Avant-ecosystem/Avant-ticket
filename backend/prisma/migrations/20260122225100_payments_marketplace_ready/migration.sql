/*
  Warnings:

  - A unique constraint covering the columns `[mpPreferenceId]` on the table `Payment` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[externalReference]` on the table `Payment` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `externalReference` to the `Payment` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Payment_eventId_idx";

-- DropIndex
DROP INDEX "Payment_organizerId_idx";

-- DropIndex
DROP INDEX "Payment_status_idx";

-- DropIndex
DROP INDEX "Payment_userId_idx";

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "externalReference" TEXT NOT NULL,
ADD COLUMN     "installments" INTEGER,
ADD COLUMN     "mpStatusDetail" TEXT,
ADD COLUMN     "paymentMethod" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Payment_mpPreferenceId_key" ON "Payment"("mpPreferenceId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_externalReference_key" ON "Payment"("externalReference");
