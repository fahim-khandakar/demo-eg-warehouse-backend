/*
  Warnings:

  - You are about to drop the `ReturnBadPartHwab` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "return_events" DROP CONSTRAINT "return_events_hwabId_fkey";

-- DropTable
DROP TABLE "ReturnBadPartHwab";

-- CreateTable
CREATE TABLE "ReturnBadPartHawb" (
    "id" SERIAL NOT NULL,
    "hawbNo" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReturnBadPartHawb_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ReturnBadPartHawb_hawbNo_key" ON "ReturnBadPartHawb"("hawbNo");

-- AddForeignKey
ALTER TABLE "return_events" ADD CONSTRAINT "return_events_hwabId_fkey" FOREIGN KEY ("hwabId") REFERENCES "ReturnBadPartHawb"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
