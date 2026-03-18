-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "babyAgeRange" TEXT,
ADD COLUMN     "images" TEXT[],
ADD COLUMN     "sizeChart" JSONB;
