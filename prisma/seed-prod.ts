/* eslint-disable no-console */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

import { ContactType, defaultAccounts } from "~/lib/constants";

const prisma = new PrismaClient();

async function seed() {
  // cleanup the existing database
  await Promise.all([
    await prisma.transactionItem.deleteMany(),
    await prisma.transaction.deleteMany(),
    await prisma.user.deleteMany(),
    await prisma.account.deleteMany(),
    await prisma.contact.deleteMany(),
    await prisma.organization.deleteMany(),
    await prisma.transactionItemType.deleteMany(),
    await prisma.contactType.deleteMany(),
    await prisma.accountType.deleteMany(),
    await prisma.transactionItemMethod.deleteMany(),
  ]);

  await Promise.all([
    await prisma.transactionItemType.createMany({ data: transactionItemTypes }),
    await prisma.transactionItemMethod.createMany({ data: transactionItemMethods }),
    await prisma.contactType.createMany({ data: contactTypes }),
    await prisma.accountType.createMany({ data: accountTypes }),
    await prisma.engagementType.createMany({ data: engagementTypes }),
  ]);

  const org = await prisma.organization.create({ data: { name: "Alliance 436" } });

  await prisma.user.create({
    data: {
      username: "paulh.morris@gmail.com",
      role: "SUPERADMIN",
      contact: {
        create: {
          firstName: "Paul",
          lastName: "Morris",
          email: "paulh.morris@gmail.com",
          typeId: ContactType.Admin,
        },
      },
      password: {
        create: {
          hash: await bcrypt.hash("qVa0gGdSkhEZsDrr", 10),
        },
      },
    },
  });

  await prisma.user.create({
    data: {
      username: "jaredn7@gmail.com",
      role: "ADMIN",
      contact: {
        create: {
          firstName: "Jared",
          lastName: "Nielsen",
          email: "jaredn7@gmail.com",
          typeId: ContactType.Staff,
        },
      },
      password: {
        create: {
          hash: await bcrypt.hash("mTs3zV5c6mUP8MMd", 10),
        },
      },
    },
  });

  await prisma.account.createMany({
    data: defaultAccounts.map((a) => ({
      ...a,
      organizationId: org.id,
    })),
  });

  console.log(`Production database has been seeded. 🌱`);
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });

const transactionItemMethods = [
  { id: 1, name: "Digital" },
  { id: 2, name: "Check" },
  { id: 3, name: "ACH" },
  { id: 4, name: "Other" },
];
const transactionItemTypes = [
  { id: 1, name: "Donation" },
  { id: 2, name: "Income" },
  { id: 3, name: "Expense" },
  { id: 4, name: "Compensation" },
  { id: 5, name: "Grant" },
  { id: 6, name: "Tax" },
  { id: 7, name: "Transfer In" },
  { id: 8, name: "Transfer Out" },
];
const contactTypes = [
  { id: 1, name: "Donor" },
  { id: 2, name: "External" },
  { id: 3, name: "Missionary" },
  { id: 4, name: "Staff" },
  { id: 5, name: "Admin" },
];
const accountTypes = [
  { id: 1, name: "Operating" },
  { id: 2, name: "Benevolence" },
  { id: 3, name: "Ministry" },
];

const engagementTypes = [
  { id: 1, name: "In Person" },
  { id: 2, name: "Phone" },
  { id: 3, name: "Text" },
  { id: 4, name: "Email" },
  { id: 5, name: "Mail" },
];
