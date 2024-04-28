/*
  Warnings:

  - A unique constraint covering the columns `[host,subdomain]` on the table `Organization` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Organization" ADD COLUMN     "subdomain" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Organization_host_subdomain_key" ON "Organization"("host", "subdomain");
