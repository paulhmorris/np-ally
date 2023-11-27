import { faker } from "@faker-js/faker";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function seed() {
  // cleanup the existing database
  await Promise.all([
    await prisma.user.deleteMany(),
    await prisma.account.deleteMany(),
    await prisma.contact.deleteMany(),
    await prisma.transaction.deleteMany(),
    await prisma.organization.deleteMany(),
    await prisma.transactionItemType.deleteMany(),
    await prisma.transactionItemMethod.deleteMany(),
    await prisma.contactType.deleteMany(),
    await prisma.accountType.deleteMany(),
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
      },
    }),
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
        accountId: account.id,
        description: faker.lorem.word(),
        transactionItems: {
          createMany: {
            data: [
              {
                amount: faker.number.int({ min: 1, max: 1000 }),
                description: faker.lorem.word(),
                typeId: 1,
                contactId: donorContact.id,
              },
              {
                amount: faker.number.int({ min: 1, max: 1000 }),
                description: faker.lorem.word(),
                typeId: 2,
                contactId: donorContact.id,
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

const transactionItemMethods = [{ name: "Cash" }, { name: "Check" }, { name: "Credit Card" }, { name: "Other" }];
const transactionItemTypes = [
  { name: "Donation" },
  { name: "Expense" },
  { name: "Compensation" },
  { name: "Grant" },
  { name: "Other" },
];
const contactTypes = [{ name: "Donor" }, { name: "Missionary" }, { name: "Staff" }];
const accountTypes = [{ name: "Operating" }, { name: "Benevolence" }, { name: "Ministry" }];
