import { test as setup } from "@playwright/test";

import { createAdmin } from "test/e2e/helpers/auth";

const authFile = "playwright/.auth/admin.json";
setup("authenticate as admin", async ({ request }) => {
  // Create admin
  const user = await createAdmin();

  // Authenticate
  await request.post("/login", {
    form: {
      email: user.username,
      password: user.password,
      remember: "false",
    },
  });
  await request.storageState({ path: authFile });
});
