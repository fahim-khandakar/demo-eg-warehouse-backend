-- AlterTable
ALTER TABLE "_UserDetailsPowers" ADD CONSTRAINT "_UserDetailsPowers_AB_pkey" PRIMARY KEY ("A", "B");

-- DropIndex
DROP INDEX "_UserDetailsPowers_AB_unique";
