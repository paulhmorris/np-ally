/* eslint-disable no-console */
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
  await Promise.all([
    await db.transactionItem.deleteMany(),
    await db.transaction.deleteMany(),
    await db.user.deleteMany(),
    await db.account.deleteMany(),
    await db.contact.deleteMany(),
    await db.organization.deleteMany(),
    await db.transactionItemType.deleteMany(),
    await db.contactType.deleteMany(),
    await db.accountType.deleteMany(),
    await db.transactionItemMethod.deleteMany(),
  ]);

  await Promise.all([
    await db.transactionItemType.createMany({ data: transactionItemTypes }),
    await db.transactionItemMethod.createMany({ data: transactionItemMethods }),
    await db.contactType.createMany({ data: contactTypes }),
    await db.accountType.createMany({ data: accountTypes }),
    await db.engagementType.createMany({ data: engagementTypes }),
  ]);

  const org = await db.organization.create({ data: { name: "Alliance 436" } });

  await db.user.create({
    data: {
      username: "paulh.morris@gmail.com",
      role: "SUPERADMIN",
      contact: {
        create: {
          firstName: "Paul",
          lastName: "Morris",
          email: "paulh.morris@gmail.com",
          typeId: ContactType.Outreach,
        },
      },
      password: {
        create: {
          hash: await bcrypt.hash("qVa0gGdSkhEZsDrr", 10),
        },
      },
    },
  });

  await db.user.create({
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

  await db.account.createMany({
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
    void db.$disconnect();
  });
