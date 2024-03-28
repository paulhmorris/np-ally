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
  await db.$transaction([
    db.transactionItem.deleteMany(),
    db.transaction.deleteMany(),
    db.membership.deleteMany(),
    db.user.deleteMany(),
    db.accountSubscription.deleteMany(),
    db.contact.deleteMany(),
    db.accountSubscription.deleteMany(),
    db.accountType.deleteMany(),
    db.account.deleteMany(),
    db.organization.deleteMany(),
    db.engagementType.deleteMany(),
    db.engagement.deleteMany(),
    db.transactionItemType.deleteMany(),
    db.contactType.deleteMany(),
    db.accountType.deleteMany(),
    db.transactionItemMethod.deleteMany(),
  ]);

  const org = await db.organization.create({ data: { name: "Alliance 436" } });
  const org2 = await db.organization.create({ data: { name: "Moms of Courage" } });

  await db.$transaction([
    db.transactionItemType.createMany({ data: transactionItemTypes.map((t) => ({ ...t, orgId: org.id })) }),
    db.transactionItemMethod.createMany({ data: transactionItemMethods.map((t) => ({ ...t, orgId: org.id })) }),
    db.contactType.createMany({ data: contactTypes.map((t) => ({ ...t, orgId: org.id })) }),
    db.accountType.createMany({ data: accountTypes.map((t) => ({ ...t, orgId: org.id })) }),
    db.engagementType.createMany({ data: engagementTypes.map((t) => ({ ...t, orgId: org.id })) }),

    db.transactionItemType.createMany({ data: transactionItemTypes.map((t) => ({ ...t, orgId: org2.id })) }),
    db.transactionItemMethod.createMany({ data: transactionItemMethods.map((t) => ({ ...t, orgId: org2.id })) }),
    db.contactType.createMany({ data: contactTypes.map((t) => ({ ...t, orgId: org2.id })) }),
    db.accountType.createMany({ data: accountTypes.map((t) => ({ ...t, orgId: org2.id })) }),
    db.engagementType.createMany({ data: engagementTypes.map((t) => ({ ...t, orgId: org2.id })) }),
  ]);

  const email = "paul@remix.run";

  const hashedPassword = await bcrypt.hash("password", 10);

  const superAdmin = await db.user.create({
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

  await db.membership.createMany({
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
    await db.user.create({
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
    await db.contact.create({
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

  const account = await db.account.create({
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

  await db.account.createMany({
    data: defaultAccounts.map((a) => ({
      ...a,
      orgId: org.id,
    })),
  });

  for (let i = 0; i < 10; i++) {
    await db.transaction.create({
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
    void db.$disconnect();
  });
