import { test as teardown } from "@playwright/test";

import prisma from "test/e2e/helpers/prisma";

teardown("delete test data", async ({}) => {
  const users = await prisma.user.deleteMany({
    where: {
      username: {
        contains: "e2e-",
      },
    },
  });
  const contacts = await prisma.contact.deleteMany({
    where: {
      email: {
        contains: "e2e-",
      },
    },
  });
  const transactionItems = await prisma.transactionItem.deleteMany({
    where: {
      transaction: {
        account: {
          description: {
            contains: "E2E",
          },
        },
      },
    },
  });
  const transactions = await prisma.transaction.deleteMany({
    where: {
      account: {
        description: {
          contains: "E2E",
        },
      },
    },
  });

  console.info("Deleted test data:", {
    users: users.count,
    contacts: contacts.count,
    transactionItems: transactionItems.count,
    transactions: transactions.count,
  });
});
