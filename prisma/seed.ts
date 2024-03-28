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
    prisma.membership.deleteMany(),
    prisma.user.deleteMany(),
    prisma.accountSubscription.deleteMany(),
    prisma.contact.deleteMany(),
    prisma.accountSubscription.deleteMany(),
    prisma.accountType.deleteMany(),
    prisma.account.deleteMany(),
    prisma.organization.deleteMany(),
    prisma.engagementType.deleteMany(),
    prisma.engagement.deleteMany(),
    prisma.transactionItemType.deleteMany(),
    prisma.contactType.deleteMany(),
    prisma.accountType.deleteMany(),
    prisma.transactionItemMethod.deleteMany(),
  ]);

  const org = await prisma.organization.create({ data: { name: "Alliance 436" } });
  const org2 = await prisma.organization.create({ data: { name: "Moms of Courage" } });

  await prisma.$transaction([
    prisma.transactionItemType.createMany({ data: transactionItemTypes.map((t) => ({ ...t, orgId: org.id })) }),
    prisma.transactionItemMethod.createMany({ data: transactionItemMethods.map((t) => ({ ...t, orgId: org.id })) }),
    prisma.contactType.createMany({ data: contactTypes.map((t) => ({ ...t, orgId: org.id })) }),
    prisma.accountType.createMany({ data: accountTypes.map((t) => ({ ...t, orgId: org.id })) }),
    prisma.engagementType.createMany({ data: engagementTypes.map((t) => ({ ...t, orgId: org.id })) }),

    prisma.transactionItemType.createMany({ data: transactionItemTypes.map((t) => ({ ...t, orgId: org2.id })) }),
    prisma.transactionItemMethod.createMany({ data: transactionItemMethods.map((t) => ({ ...t, orgId: org2.id })) }),
    prisma.contactType.createMany({ data: contactTypes.map((t) => ({ ...t, orgId: org2.id })) }),
    prisma.accountType.createMany({ data: accountTypes.map((t) => ({ ...t, orgId: org2.id })) }),
    prisma.engagementType.createMany({ data: engagementTypes.map((t) => ({ ...t, orgId: org2.id })) }),
  ]);

  const email = "paul@remix.run";

  const hashedPassword = await bcrypt.hash("password", 10);

  const superAdmin = await prisma.user.create({
    data: {
      username: email,
      role: "SUPERADMIN",
      contact: {
        create: {
          firstName: "Paul",
          lastName: "Morris",
          email,
          typeId: ContactType.Outreach,
          orgId: org.id,
        },
      },
      password: {
        create: {
          hash: hashedPassword,
          orgId: org.id,
        },
      },
    },
  });

  await prisma.membership.createMany({
    data: [
      {
        userId: superAdmin.id,
        orgId: org.id,
        role: "ADMIN",
      },
      {
        userId: superAdmin.id,
        orgId: org2.id,
        role: "ADMIN",
      },
    ],
  });

  const [user, donorContact] = await Promise.all([
    await prisma.user.create({
      data: {
        username: "cassian@therebellion.com",
        role: "USER",
        contact: {
          create: {
            firstName: "Cassian",
            lastName: "Andor",
            email: "cassian@therebllion.com",
            typeId: ContactType.Missionary,
            orgId: org.id,
          },
        },
        password: {
          create: {
            hash: hashedPassword,
            orgId: org.id,
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
            orgId: org.id,
          },
        },
        orgId: org.id,
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
          orgId: org.id,
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
        orgId: org.id,
        transactionItems: {
          createMany: {
            data: [
              {
                amountInCents: faker.number.int({ min: 100, max: 50_000 }),
                description: faker.lorem.word(),
                typeId: 1,
                orgId: org.id,
              },
              {
                amountInCents: faker.number.int({ min: 100, max: 50_000 }),
                description: faker.lorem.word(),
                typeId: 2,
                orgId: org.id,
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
