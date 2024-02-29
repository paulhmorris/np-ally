import { expect, test } from "@playwright/test";

test.use({ storageState: "playwright/.auth/admin.json" });
test.describe("Profile", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /open user menu/i }).click();
    await page.getByRole("menuitem", { name: /profile/i }).click();
  });

  test("should display profile", async ({ page }) => {
    await expect(page).toHaveURL(/users/i);
    await expect(page).toHaveTitle(/user/i);
  });

  test("should display user details", async ({ page }) => {
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Admin E2E");
    await expect(page.getByRole("textbox", { name: /first name/i })).toHaveValue("Admin");
    await expect(page.getByRole("textbox", { name: /last name/i })).toHaveValue("E2E");
    await expect(page.getByRole("textbox", { name: /username/i })).toBeDisabled();
    await expect(page.getByLabel(/role/i)).toBeDisabled();
    await expect(page.getByLabel(/select an account/i)).toBeVisible();
  });

  test("should update user details", async ({ page }) => {
    await page.getByRole("textbox", { name: /first name/i }).fill("Updated");
    await page.getByRole("textbox", { name: /last name/i }).fill("E2E");
    await page.getByRole("button", { name: /save/i }).click();

    await expect(page).toHaveURL(/users/i);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Updated E2E");
    await expect(page.getByRole("status")).toHaveText(/updated/i);

    await page.getByRole("textbox", { name: /first name/i }).fill("Admin");
    await page.getByRole("textbox", { name: /last name/i }).fill("E2E");
    await page.getByRole("button", { name: /save/i }).click();

    await expect(page).toHaveURL(/users/i);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Admin E2E");
  });
});
