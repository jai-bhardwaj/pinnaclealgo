-- AlterTable
ALTER TABLE "strategies" ADD COLUMN     "basePrice" DOUBLE PRECISION NOT NULL DEFAULT 50000.0,
ADD COLUMN     "margin" DOUBLE PRECISION NOT NULL DEFAULT 5.0,
ADD COLUMN     "marginType" TEXT NOT NULL DEFAULT 'percentage';
