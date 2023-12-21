/* eslint-disable no-console */
import { faker } from "@faker-js/faker";
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

  const email = "paul@remix.run";
  const org = await prisma.organization.create({ data: { name: "Alliance 436" } });

  const hashedPassword = await bcrypt.hash("password", 10);

  await prisma.user.create({
    data: {
      username: email,
      role: "SUPERADMIN",
      contact: {
        create: {
          firstName: "Paul",
          lastName: "Morris",
          email,
          typeId: ContactType.Admin,
        },
      },
      password: {
        create: {
          hash: hashedPassword,
        },
      },
    },
  });

  const [user, donorContact] = await Promise.all([
    await prisma.user.create({
      data: {
        username: "j@caudle.com",
        role: "USER",
        contact: {
          create: {
            firstName: "Jessica",
            lastName: "Caudle",
            email: "j@caudle.com",
            typeId: ContactType.Missionary,
          },
        },
        password: {
          create: {
            hash: hashedPassword,
          },
        },
      },
    }),
    await prisma.contact.create({
      data: {
        firstName: "Joe",
        lastName: "Donor",
        email: "mr@donor.com",
        phone: "555-555-5555",
        typeId: 1,
        address: {
          create: {
            street: "1234 Main St",
            city: "Anytown",
            state: "CA",
            zip: "12345",
            country: "USA",
          },
        },
      },
    }),
  ]);

  const account = await prisma.account.create({
    data: {
      typeId: 3,
      code: "3001-CA",
      activityRecipients: ["j@caudle.com"],
      description: "Jessica Caudle - Ministry Fund",
      organizationId: org.id,
      userId: user.id,
    },
  });

  await prisma.account.createMany({
    data: defaultAccounts.map((a) => ({
      ...a,
      organizationId: org.id,
    })),
  });

  for (let i = 0; i < 10; i++) {
    await prisma.transaction.create({
      data: {
        amountInCents: faker.number.int({ min: 100, max: 100_000 }),
        date: faker.date.past(),
        description: faker.lorem.word(),
        accountId: account.id,
        donorId: donorContact.id,
        transactionItems: {
          createMany: {
            data: [
              {
                amountInCents: faker.number.int({ min: 100, max: 50_000 }),
                description: faker.lorem.word(),
                typeId: 1,
              },
              {
                amountInCents: faker.number.int({ min: 100, max: 50_000 }),
                description: faker.lorem.word(),
                typeId: 2,
              },
            ],
          },
        },
      },
    });
  }

  console.log(`Database has been seeded. 🌱`);
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
  { id: 2, name: "Expense" },
  { id: 3, name: "Compensation" },
  { id: 4, name: "Grant" },
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
