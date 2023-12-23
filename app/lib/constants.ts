import { Prisma } from "@prisma/client";

export enum AccountType {
  Operating = 1,
  Benevolence = 2,
  Ministry = 3,
}

export enum ContactType {
  Donor = 1,
  External = 2,
  Missionary = 3,
  Staff = 4,
  Admin = 5,
}

export enum EngagementType {
  In_Person = 1,
  Phone = 2,
  Text = 3,
  Email = 4,
  Mail = 5,
}

export enum TransactionItemType {
  Donation = 1,
  Income = 2,
  Expense = 3,
  Compensation = 4,
  Grant = 5,
  Tax = 6,
  Transfer_In = 7,
  Transfer_Out = 8,
}

export enum TransactionItemMethod {
  Digital = 1,
  Check = 2,
  ACH = 3,
  Other = 4,
}

export const defaultAccounts: Array<Prisma.AccountUncheckedCreateInput> = [
  { code: "1001", description: "General Fund", typeId: AccountType.Operating },
  { code: "1002", description: "Local", typeId: AccountType.Operating },
  { code: "1003", description: "International", typeId: AccountType.Operating },
];

export enum LinearTeamID {
  Alliance = "8349d9bf-176e-4f6a-a841-181c31a4ff9d",
}

export enum LinearLabelID {
  Bug = "b97e1140-3f36-4f85-a014-01146171451d",
  Feature = "25229fd3-a050-443b-9baf-c17acb08ef90",
  Improvement = "d7b2166a-61dd-4f25-995d-7288f9c162fc",
}

interface NavLink {
  name: string;
  href: string;
}

export const globalNavLinks: ReadonlyArray<NavLink> = [
  { name: "Home", href: "/" },
  { name: "Contacts", href: "/contacts" },
  { name: "Transactions", href: "/transactions" },
] as const;

export const userNavLinks: ReadonlyArray<NavLink> = [
  { name: "Request Reimbursement", href: "/reimbursements/new" },
] as const;

export const adminNavLinks: ReadonlyArray<NavLink> = [
  { name: "Add Income", href: "/income/new" },
  { name: "Add Expense", href: "/expense/new" },
  { name: "Add Transfer", href: "/transfer/new" },
  { name: "Accounts", href: "/accounts" },
] as const;
