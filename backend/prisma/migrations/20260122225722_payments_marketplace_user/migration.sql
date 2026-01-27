/*
  Warnings:

  - A unique constraint covering the columns `[mpUserId]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "mpAccessToken" TEXT,
ADD COLUMN     "mpRefreshToken" TEXT,
ADD COLUMN     "mpTokenExpiresAt" TIMESTAMP(3),
ADD COLUMN     "mpUserId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_mpUserId_key" ON "User"("mpUserId");
