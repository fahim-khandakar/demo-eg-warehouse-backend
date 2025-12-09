/*
  Warnings:

  - You are about to drop the column `hwab` on the `return_events` table. All the data in the column will be lost.
  - You are about to drop the column `serialNo` on the `return_events` table. All the data in the column will be lost.
  - Added the required column `hwabId` to the `return_events` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "return_events" DROP COLUMN "hwab",
DROP COLUMN "serialNo",
ADD COLUMN     "hwabId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "shipment" ADD COLUMN     "invoiceValue" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "Hwab" (
    "id" SERIAL NOT NULL,
    "hwabNo" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Hwab_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Hwab_hwabNo_key" ON "Hwab"("hwabNo");

-- AddForeignKey
ALTER TABLE "return_events" ADD CONSTRAINT "return_events_hwabId_fkey" FOREIGN KEY ("hwabId") REFERENCES "Hwab"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
