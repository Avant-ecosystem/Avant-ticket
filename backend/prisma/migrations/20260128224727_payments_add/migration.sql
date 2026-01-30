/*
  Warnings:

  - A unique constraint covering the columns `[amplifyPaymentId]` on the table `Payment` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "amplifyPaymentId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Payment_amplifyPaymentId_key" ON "Payment"("amplifyPaymentId");
