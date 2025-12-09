/*
  Warnings:

  - You are about to drop the `Hwab` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "return_events" DROP CONSTRAINT "return_events_hwabId_fkey";

-- DropTable
DROP TABLE "Hwab";

-- CreateTable
CREATE TABLE "ReturnBadPartHwab" (
    "id" SERIAL NOT NULL,
    "hwabNo" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReturnBadPartHwab_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ReturnBadPartHwab_hwabNo_key" ON "ReturnBadPartHwab"("hwabNo");

-- AddForeignKey
ALTER TABLE "return_events" ADD CONSTRAINT "return_events_hwabId_fkey" FOREIGN KEY ("hwabId") REFERENCES "ReturnBadPartHwab"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
