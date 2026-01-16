-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "imageUrl" TEXT,
ADD COLUMN     "price" DECIMAL(65,30) NOT NULL DEFAULT 0;
