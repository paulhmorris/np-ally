import { test as setup } from "@playwright/test";

import db from "test/e2e/helpers/db";
import { AccountType } from "~/lib/constants";

setup("setup db", async () => {
  const org = await db.organization.create({
    data: {
      host: "E2E-Test.org",
      name: "E2E-Test Organization",
    },
  });

  const [accounts] = await db.$transaction([
    db.account.createMany({
      data: [
        {
          orgId: org.id,
          code: "9998-E2E",
          typeId: AccountType.Benevolence,
          description: "E2E Account 1",
        },
        {
          orgId: org.id,
          code: "9999-E2E",
          typeId: AccountType.Benevolence,
          description: "E2E Account 2",
        },
      ],
    }),
  ]);
  console.info(`DB Setup: Created ${accounts.count} accounts`);
});
