import fs from "fs";
import path from "path";

import { test as baseTest } from "@playwright/test";

import { createAdmin } from "test/e2e/helpers/auth";
import prisma from "test/e2e/helpers/prisma";

export * from "@playwright/test";
// eslint-disable-next-line @typescript-eslint/ban-types
export const test = baseTest.extend<{}, { workerStorageState: string }>({
  storageState: ({ workerStorageState }, use) => use(workerStorageState),
  workerStorageState: [
    async ({ browser }, use) => {
      const id = test.info().parallelIndex;
      const fileName = path.resolve(test.info().project.outputDir, `.auth/${id}.json`);

      if (fs.existsSync(fileName)) {
        await use(fileName);
        return;
      }

      const page = await browser.newPage({ storageState: undefined });
      const user = await createAdmin();

      await page.goto("http://127.0.0.1:3000/login");
      await page.getByLabel("Email").fill(user.username);
      await page.getByLabel("Password").fill(user.password);
      await page.getByRole("button", { name: "Log in" }).click();

      await page.waitForURL(/dashboards/);

      await page.context().storageState({ path: fileName });
      await page.close();
      await use(fileName);
      await prisma.user.deleteMany({ where: { username: user.username } });
      await prisma.contact.deleteMany({ where: { email: user.username } });
    },
    { scope: "worker" },
  ],
});
