/* eslint-disable no-console */
import { faker } from "@faker-js/faker";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

import {
  ContactType,
  accountTypes,
  contactTypes,
  defaultAccounts,
  engagementTypes,
  transactionItemMethods,
  transactionItemTypes,
} from "~/lib/constants";

const prisma = new PrismaClient();

async function seed() {
  // cleanup the existing database
  await prisma.$transaction([
    prisma.transactionItem.deleteMany(),
    prisma.transaction.deleteMany(),
    prisma.organizationMembership.deleteMany(),
    prisma.user.deleteMany(),
    prisma.accountSubscription.deleteMany(),
    prisma.contact.deleteMany(),
    prisma.account.deleteMany(),
    prisma.organization.deleteMany(),
    prisma.engagementType.deleteMany(),
    prisma.transactionItemType.deleteMany(),
    prisma.contactType.deleteMany(),
    prisma.accountType.deleteMany(),
    prisma.transactionItemMethod.deleteMany(),
  ]);

  await prisma.$transaction([
    prisma.transactionItemType.createMany({ data: transactionItemTypes }),
    prisma.transactionItemMethod.createMany({ data: transactionItemMethods }),
    prisma.contactType.createMany({ data: contactTypes }),
    prisma.accountType.createMany({ data: accountTypes }),
    prisma.engagementType.createMany({ data: engagementTypes }),
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
          typeId: ContactType.Outreach,
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
        phone: "5555555555",
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
      subscribers: {
        create: {
          subscriberId: user.contactId,
        },
      },
      description: "Jessica Caudle - Ministry Fund",
      orgId: org.id,
      user: {
        connect: {
          id: user.id,
        },
      },
    },
  });

  await prisma.account.createMany({
    data: defaultAccounts.map((a) => ({
      ...a,
      orgId: org.id,
    })),
  });

  for (let i = 0; i < 10; i++) {
    await prisma.transaction.create({
      data: {
        amountInCents: faker.number.int({ min: 100, max: 100_000 }),
        date: faker.date.past(),
        description: faker.lorem.word(),
        accountId: account.id,
        contactId: donorContact.id,
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
