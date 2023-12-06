export enum AccountType {
  Operating = 1,
  Benevolence = 2,
  Ministry = 3,
}

export enum ContactType {
  Donor = 1,
  Missionary = 2,
  Staff = 3,
  Admin = 4,
}

export enum TransactionItemType {
  Donation = 1,
  Expense = 2,
  Compensation = 3,
  Grant = 4,
  Other = 5,
}

export enum TransactionItemMethod {
  Cash = 1,
  Check = 2,
  CreditCard = 3,
  Other = 4,
}

export enum LinearTeamID {
  Alliance = "8349d9bf-176e-4f6a-a841-181c31a4ff9d",
}

export enum LinearLabelID {
  Bug = "b97e1140-3f36-4f85-a014-01146171451d",
  Feature = "25229fd3-a050-443b-9baf-c17acb08ef90",
  Improvement = "d7b2166a-61dd-4f25-995d-7288f9c162fc",
}

export const userNavLinks: ReadonlyArray<{
  name: string;
  href: string;
}> = [{ name: "Add Expense", href: "/reimbursements/new" }] as const;

export const adminNavLinks: ReadonlyArray<{
  name: string;
  href: string;
}> = [
  { name: "Add Donation", href: "/donations/new" },
  { name: "Add Payment", href: "/payments/new" },
  { name: "Contacts", href: "/contacts" },
] as const;
