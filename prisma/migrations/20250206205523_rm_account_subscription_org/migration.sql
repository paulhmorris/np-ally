/*
  Warnings:

  - You are about to drop the column `orgId` on the `AccountSubscription` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "AccountSubscription" DROP CONSTRAINT "AccountSubscription_orgId_fkey";

-- AlterTable
ALTER TABLE "AccountSubscription" DROP COLUMN "orgId";
