/*
  Warnings:

  - You are about to drop the column `price` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `ticketsMinted` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `ticketsTotal` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `zones` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `zone` on the `Ticket` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Event" DROP COLUMN "price",
DROP COLUMN "ticketsMinted",
DROP COLUMN "ticketsTotal",
DROP COLUMN "zones";

-- AlterTable
ALTER TABLE "Ticket" DROP COLUMN "zone",
ADD COLUMN     "zoneId" TEXT;

-- CreateTable
CREATE TABLE "EventZone" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" DECIMAL(65,30) NOT NULL,
    "capacity" BIGINT NOT NULL,
    "sold" BIGINT NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EventZone_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EventZone_eventId_idx" ON "EventZone"("eventId");

-- CreateIndex
CREATE UNIQUE INDEX "EventZone_eventId_name_key" ON "EventZone"("eventId", "name");

-- CreateIndex
CREATE INDEX "Ticket_zoneId_idx" ON "Ticket"("zoneId");

-- AddForeignKey
ALTER TABLE "EventZone" ADD CONSTRAINT "EventZone_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "EventZone"("id") ON DELETE SET NULL ON UPDATE CASCADE;
