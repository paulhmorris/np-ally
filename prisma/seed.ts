import { faker } from "@faker-js/faker";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

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
    await prisma.transactionItemType.createMany({
      data: transactionItemTypes,
    }),
    await prisma.transactionItemMethod.createMany({
      data: transactionItemMethods,
    }),
    await prisma.contactType.createMany({
      data: contactTypes,
    }),
    await prisma.accountType.createMany({
      data: accountTypes,
    }),
  ]);

  const email = "paul@remix.run";
  const org = await prisma.organization.create({ data: { name: "Alliance 436" } });

  const hashedPassword = await bcrypt.hash("password", 10);

  await prisma.user.create({
    data: {
      role: "SUPERADMIN",
      contact: {
        create: {
          firstName: "Paul",
          lastName: "Morris",
          email,
          typeId: 4,
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
        role: "USER",
        contact: {
          create: {
            firstName: "Jessica",
            lastName: "Caudle",
            email: "test@example.com",
            typeId: 4,
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
      },
    }),
  ]);

  const account = await prisma.account.create({
    data: {
      typeId: 3,
      code: "C3001",
      description: "Jessica Caudle - Ministry Fund",
      organizationId: org.id,
      userId: user.id,
    },
  });

  for (let i = 0; i < 10; i++) {
    await prisma.transaction.create({
      data: {
        amount: faker.number.int({ min: 1, max: 1000 }),
        date: faker.date.past(),
        description: faker.lorem.word(),
        transactionItems: {
          createMany: {
            data: [
              {
                amount: faker.number.int({ min: 1, max: 1000 }),
                description: faker.lorem.word(),
                typeId: 1,
                contactId: donorContact.id,
                accountId: account.id,
              },
              {
                amount: faker.number.int({ min: 1, max: 1000 }),
                description: faker.lorem.word(),
                typeId: 2,
                contactId: donorContact.id,
                accountId: account.id,
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
  { id: 1, name: "Cash" },
  { id: 2, name: "Check" },
  { id: 3, name: "Credit Card" },
  { id: 4, name: "Other" },
];
const transactionItemTypes = [
  { id: 1, name: "Donation" },
  { id: 2, name: "Expense" },
  { id: 3, name: "Compensation" },
  { id: 4, name: "Grant" },
  { id: 5, name: "Other" },
];
const contactTypes = [
  { id: 1, name: "Donor" },
  { id: 2, name: "Missionary" },
  { id: 3, name: "Staff" },
  { id: 4, name: "Admin" },
];
const accountTypes = [
  { id: 1, name: "Operating" },
  { id: 2, name: "Benevolence" },
  { id: 3, name: "Ministry" },
];
