/*
  Warnings:

  - A unique constraint covering the columns `[username]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[dni]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `calle` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `ciudad` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `codigoPostal` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `dni` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `numero` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `pais` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `password` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `provincia` to the `User` table without a default value. This is not possible if the table is not empty.
  - Made the column `email` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "calle" TEXT NOT NULL,
ADD COLUMN     "ciudad" TEXT NOT NULL,
ADD COLUMN     "codigoPostal" TEXT NOT NULL,
ADD COLUMN     "dni" TEXT NOT NULL,
ADD COLUMN     "numero" TEXT NOT NULL,
ADD COLUMN     "pais" TEXT NOT NULL,
ADD COLUMN     "password" TEXT NOT NULL,
ADD COLUMN     "provincia" TEXT NOT NULL,
ALTER COLUMN "walletAddress" DROP NOT NULL,
ALTER COLUMN "email" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_dni_key" ON "User"("dni");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_username_idx" ON "User"("username");

-- CreateIndex
CREATE INDEX "User_dni_idx" ON "User"("dni");
