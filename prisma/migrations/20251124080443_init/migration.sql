/*
  Warnings:

  - The primary key for the `_UserDetailsPowers` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - A unique constraint covering the columns `[A,B]` on the table `_UserDetailsPowers` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "_UserDetailsPowers" DROP CONSTRAINT "_UserDetailsPowers_AB_pkey";

-- CreateIndex
CREATE UNIQUE INDEX "_UserDetailsPowers_AB_unique" ON "_UserDetailsPowers"("A", "B");
