/*
  Warnings:

  - You are about to drop the column `customerRequestId` on the `orders` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[orderId]` on the table `customer_requests` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "orders" DROP CONSTRAINT "orders_customerRequestId_fkey";

-- DropIndex
DROP INDEX "orders_customerRequestId_key";

-- AlterTable
ALTER TABLE "customer_requests" ADD COLUMN     "orderId" INTEGER;

-- AlterTable
ALTER TABLE "orders" DROP COLUMN "customerRequestId";

-- CreateIndex
CREATE UNIQUE INDEX "customer_requests_orderId_key" ON "customer_requests"("orderId");

-- AddForeignKey
ALTER TABLE "customer_requests" ADD CONSTRAINT "customer_requests_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;
