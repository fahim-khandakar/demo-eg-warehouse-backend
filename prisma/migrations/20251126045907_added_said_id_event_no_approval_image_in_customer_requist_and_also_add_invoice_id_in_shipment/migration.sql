-- AlterTable
ALTER TABLE "customer_requests" ADD COLUMN     "approvalImage" TEXT,
ADD COLUMN     "eventNo" TEXT,
ADD COLUMN     "saidId" TEXT;

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "eventNo" TEXT;

-- AlterTable
ALTER TABLE "shipment" ADD COLUMN     "invoiceNo" TEXT;
