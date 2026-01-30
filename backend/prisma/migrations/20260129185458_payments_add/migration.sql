/*
  Warnings:

  - A unique constraint covering the columns `[oxapayPaymentId]` on the table `Payment` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "oxapayPaymentId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Payment_oxapayPaymentId_key" ON "Payment"("oxapayPaymentId");
