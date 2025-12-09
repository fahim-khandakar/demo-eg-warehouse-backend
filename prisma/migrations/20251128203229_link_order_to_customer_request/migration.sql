/*
  Warnings:

  - A unique constraint covering the columns `[customerRequestId]` on the table `orders` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `customerRequestId` to the `orders` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "customerRequestId" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "orders_customerRequestId_key" ON "orders"("customerRequestId");

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_customerRequestId_fkey" FOREIGN KEY ("customerRequestId") REFERENCES "customer_requests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
