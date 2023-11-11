import { faker } from "@faker-js/faker";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function seed() {
  const email = "paul@remix.run";

  // cleanup the existing database
  await prisma.user.delete({ where: { email } }).catch(() => {
    // no worries if it doesn't exist yet
  });

  const org = await prisma.organization.create({ data: { name: "Alliance 436" } });

  const hashedPassword = await bcrypt.hash("password", 10);

  await prisma.user.create({
    data: {
      role: "SUPERADMIN",
      firstName: "Paul",
      lastName: "Morris",
      email,
      password: {
        create: {
          hash: hashedPassword,
        },
      },
    },
  });

  const user = await prisma.user.create({
    data: {
      role: "USER",
      email: "test@example.com",
      password: {
        create: {
          hash: hashedPassword,
        },
      },
      firstName: "Jessica",
      lastName: "Caudle",
    },
  });

  const account = await prisma.account.create({
    data: {
      name: "Jessica Caudle",
      organizationId: org.id,
      userId: user.id,
    },
  });

  const donor = await prisma.donor.create({
    data: {
      name: "Mr. Donor",
      email: "mr@donor.com",
      phone: "555-555-5555",
    },
  });

  await prisma.transactionItemType.createMany({
    data: transactionItemTypes,
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
                transactionItemTypeId: 1,
                donorId: donor.id,
              },
              {
                amount: faker.number.int({ min: 1, max: 1000 }),
                description: faker.lorem.word(),
                transactionItemTypeId: 2,
                donorId: donor.id,
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

const transactionItemTypes = [{ name: "Cash" }, { name: "Check" }, { name: "Credit Card" }, { name: "Other" }];
