/*
  Warnings:

  - You are about to drop the column `isActive` on the `Account` table. All the data in the column will be lost.
  - You are about to drop the column `organizationId` on the `Account` table. All the data in the column will be lost.
  - You are about to drop the column `isActive` on the `Address` table. All the data in the column will be lost.
  - You are about to drop the column `isActive` on the `Contact` table. All the data in the column will be lost.
  - You are about to drop the column `isActive` on the `Organization` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[code,orgId]` on the table `Account` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[accountId,subscriberId]` on the table `AccountSubscription` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[name,orgId]` on the table `AccountType` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[email,orgId]` on the table `Contact` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[contactId,userId]` on the table `ContactAssigment` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[name,orgId]` on the table `ContactType` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[name,orgId]` on the table `EngagementType` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[host]` on the table `Organization` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[name,orgId]` on the table `TransactionItemMethod` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[name,orgId]` on the table `TransactionItemType` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "MembershipRole" AS ENUM ('MEMBER', 'ADMIN');

-- DropForeignKey
ALTER TABLE "Account" DROP CONSTRAINT "Account_organizationId_fkey";

-- DropIndex
DROP INDEX "Account_code_key";

-- DropIndex
DROP INDEX "AccountType_name_key";

-- DropIndex
DROP INDEX "Contact_email_key";

-- DropIndex
DROP INDEX "ContactType_name_key";

-- DropIndex
DROP INDEX "EngagementType_name_key";

-- DropIndex
DROP INDEX "TransactionItemMethod_name_key";

-- DropIndex
DROP INDEX "TransactionItemType_name_key";

-- AlterTable
ALTER TABLE "Account" DROP COLUMN "isActive",
DROP COLUMN "organizationId",
ADD COLUMN     "orgId" TEXT;

-- AlterTable
ALTER TABLE "AccountSubscription" ADD COLUMN     "orgId" TEXT;

-- AlterTable
ALTER TABLE "AccountType" ADD COLUMN     "orgId" TEXT;

-- AlterTable
ALTER TABLE "Address" DROP COLUMN "isActive",
ADD COLUMN     "orgId" TEXT;

-- AlterTable
ALTER TABLE "Announcement" ADD COLUMN     "orgId" TEXT;

-- AlterTable
ALTER TABLE "Contact" DROP COLUMN "isActive",
ADD COLUMN     "orgId" TEXT;

-- AlterTable
ALTER TABLE "ContactAssigment" ADD COLUMN     "orgId" TEXT;

-- AlterTable
ALTER TABLE "ContactType" ADD COLUMN     "orgId" TEXT;

-- AlterTable
ALTER TABLE "Engagement" ADD COLUMN     "orgId" TEXT;

-- AlterTable
ALTER TABLE "EngagementType" ADD COLUMN     "orgId" TEXT;

-- AlterTable
ALTER TABLE "Organization" DROP COLUMN "isActive",
ADD COLUMN     "administratorEmail" TEXT,
ADD COLUMN     "host" TEXT,
ADD COLUMN     "inquiriesEmail" TEXT,
ADD COLUMN     "replyToEmail" TEXT NOT NULL DEFAULT 'no-reply';

-- AlterTable
ALTER TABLE "Receipt" ADD COLUMN     "orgId" TEXT;

-- AlterTable
ALTER TABLE "ReimbursementRequest" ADD COLUMN     "orgId" TEXT;

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "orgId" TEXT;

-- AlterTable
ALTER TABLE "TransactionItem" ADD COLUMN     "orgId" TEXT;

-- AlterTable
ALTER TABLE "TransactionItemMethod" ADD COLUMN     "orgId" TEXT;

-- AlterTable
ALTER TABLE "TransactionItemType" ADD COLUMN     "orgId" TEXT;

-- CreateTable
CREATE TABLE "Membership" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "role" "MembershipRole" NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Membership_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Membership_userId_orgId_key" ON "Membership"("userId", "orgId");

-- CreateIndex
CREATE UNIQUE INDEX "Account_code_orgId_key" ON "Account"("code", "orgId");

-- CreateIndex
CREATE UNIQUE INDEX "AccountSubscription_accountId_subscriberId_key" ON "AccountSubscription"("accountId", "subscriberId");

-- CreateIndex
CREATE UNIQUE INDEX "AccountType_name_orgId_key" ON "AccountType"("name", "orgId");

-- CreateIndex
CREATE UNIQUE INDEX "Contact_email_orgId_key" ON "Contact"("email", "orgId");

-- CreateIndex
CREATE UNIQUE INDEX "ContactAssigment_contactId_userId_key" ON "ContactAssigment"("contactId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "ContactType_name_orgId_key" ON "ContactType"("name", "orgId");

-- CreateIndex
CREATE UNIQUE INDEX "EngagementType_name_orgId_key" ON "EngagementType"("name", "orgId");

-- CreateIndex
CREATE UNIQUE INDEX "Organization_host_key" ON "Organization"("host");

-- CreateIndex
CREATE UNIQUE INDEX "TransactionItemMethod_name_orgId_key" ON "TransactionItemMethod"("name", "orgId");

-- CreateIndex
CREATE UNIQUE INDEX "TransactionItemType_name_orgId_key" ON "TransactionItemType"("name", "orgId");

-- AddForeignKey
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountType" ADD CONSTRAINT "AccountType_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountSubscription" ADD CONSTRAINT "AccountSubscription_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransactionItem" ADD CONSTRAINT "TransactionItem_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransactionItemMethod" ADD CONSTRAINT "TransactionItemMethod_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransactionItemType" ADD CONSTRAINT "TransactionItemType_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReimbursementRequest" ADD CONSTRAINT "ReimbursementRequest_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Receipt" ADD CONSTRAINT "Receipt_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contact" ADD CONSTRAINT "Contact_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContactType" ADD CONSTRAINT "ContactType_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContactAssigment" ADD CONSTRAINT "ContactAssigment_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Address" ADD CONSTRAINT "Address_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Engagement" ADD CONSTRAINT "Engagement_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EngagementType" ADD CONSTRAINT "EngagementType_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Announcement" ADD CONSTRAINT "Announcement_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
