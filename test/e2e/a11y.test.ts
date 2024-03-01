import { expect, test } from "./helpers/axe-test";

test.use({ storageState: "playwright/.auth/admin.json" });
test.describe("should have no a11y issues on", () => {
  test.use({ storageState: { cookies: [], origins: [] } });
  test("login", async ({ page, makeAxeBuilder }) => {
    await page.goto("/login");
    const accessibilityScanResults = await makeAxeBuilder().analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });
});

test.describe("should have no a11y issues on", () => {
  test("admin dashboard", async ({ page, makeAxeBuilder }) => {
    await page.goto("/dashboards/admin");
    const accessibilityScanResults = await makeAxeBuilder().analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test("staff dashboard", async ({ page, makeAxeBuilder }) => {
    await page.goto("/dashboards/staff");
    const accessibilityScanResults = await makeAxeBuilder().analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test("accounts index", async ({ page, makeAxeBuilder }) => {
    await page.goto("/accounts");
    const accessibilityScanResults = await makeAxeBuilder().analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test("account create", async ({ page, makeAxeBuilder }) => {
    await page.goto("/accounts/new");
    const accessibilityScanResults = await makeAxeBuilder().analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  // contacts
  test("contacts index", async ({ page, makeAxeBuilder }) => {
    await page.goto("/contacts");
    const accessibilityScanResults = await makeAxeBuilder().analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test("contact create", async ({ page, makeAxeBuilder }) => {
    await page.goto("/contacts/new");
    const accessibilityScanResults = await makeAxeBuilder().analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  // engagements
  test("engagements index", async ({ page, makeAxeBuilder }) => {
    await page.goto("/engagements");
    const accessibilityScanResults = await makeAxeBuilder().analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test("engagement create", async ({ page, makeAxeBuilder }) => {
    await page.goto("/engagements/new");
    const accessibilityScanResults = await makeAxeBuilder().analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  // reimbursements
  test("reimbursements index", async ({ page, makeAxeBuilder }) => {
    await page.goto("/reimbursements");
    const accessibilityScanResults = await makeAxeBuilder().analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test("reimbursement create", async ({ page, makeAxeBuilder }) => {
    await page.goto("/reimbursements/new");
    const accessibilityScanResults = await makeAxeBuilder().analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  // users
  test("users index", async ({ page, makeAxeBuilder }) => {
    await page.goto("/users");
    const accessibilityScanResults = await makeAxeBuilder().analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test("user create", async ({ page, makeAxeBuilder }) => {
    await page.goto("/users/new");
    const accessibilityScanResults = await makeAxeBuilder().analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test("add income", async ({ page, makeAxeBuilder }) => {
    await page.goto("/income/new");
    const accessibilityScanResults = await makeAxeBuilder().analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test("add expense", async ({ page, makeAxeBuilder }) => {
    await page.goto("/expense/new");
    const accessibilityScanResults = await makeAxeBuilder().analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test("add transfer", async ({ page, makeAxeBuilder }) => {
    await page.goto("/transfer/new");
    const accessibilityScanResults = await makeAxeBuilder().analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });
});
