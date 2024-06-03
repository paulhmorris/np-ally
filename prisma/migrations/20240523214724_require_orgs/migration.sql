/*
  Warnings:

  - Made the column `orgId` on table `Account` required. This step will fail if there are existing NULL values in that column.
  - Made the column `orgId` on table `AccountSubscription` required. This step will fail if there are existing NULL values in that column.
  - Made the column `orgId` on table `Address` required. This step will fail if there are existing NULL values in that column.
  - Made the column `orgId` on table `Announcement` required. This step will fail if there are existing NULL values in that column.
  - Made the column `orgId` on table `Contact` required. This step will fail if there are existing NULL values in that column.
  - Made the column `orgId` on table `ContactAssigment` required. This step will fail if there are existing NULL values in that column.
  - Made the column `orgId` on table `Engagement` required. This step will fail if there are existing NULL values in that column.
  - Made the column `host` on table `Organization` required. This step will fail if there are existing NULL values in that column.
  - Made the column `orgId` on table `Receipt` required. This step will fail if there are existing NULL values in that column.
  - Made the column `orgId` on table `ReimbursementRequest` required. This step will fail if there are existing NULL values in that column.
  - Made the column `orgId` on table `Transaction` required. This step will fail if there are existing NULL values in that column.
  - Made the column `orgId` on table `TransactionItem` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "Account" DROP CONSTRAINT "Account_orgId_fkey";

-- AlterTable
ALTER TABLE "Account" ALTER COLUMN "orgId" SET NOT NULL;

-- AlterTable
ALTER TABLE "AccountSubscription" ALTER COLUMN "orgId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Address" ALTER COLUMN "orgId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Announcement" ALTER COLUMN "orgId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Contact" ALTER COLUMN "orgId" SET NOT NULL;

-- AlterTable
ALTER TABLE "ContactAssigment" ALTER COLUMN "orgId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Engagement" ALTER COLUMN "orgId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Organization" ALTER COLUMN "host" SET NOT NULL;

-- AlterTable
ALTER TABLE "Receipt" ALTER COLUMN "orgId" SET NOT NULL;

-- AlterTable
ALTER TABLE "ReimbursementRequest" ALTER COLUMN "orgId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Transaction" ALTER COLUMN "orgId" SET NOT NULL;

-- AlterTable
ALTER TABLE "TransactionItem" ALTER COLUMN "orgId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
