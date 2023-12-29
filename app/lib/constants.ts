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
  PayPal = 1,
  Check = 2,
  ACH = 3,
  Credit_Card = 4,
  Debit_Card = 5,
  Tithely = 6,
}

export const transactionItemMethods: Array<{ id: TransactionItemMethod; name: string }> = [
  { id: 1, name: "PayPal" },
  { id: 2, name: "Check" },
  { id: 3, name: "ACH" },
  { id: 4, name: "Credit Card" },
  { id: 5, name: "Debit Card" },
  { id: 6, name: "Tithe.ly" },
];
export const transactionItemTypes: Array<{ id: TransactionItemType; name: string }> = [
  { id: 1, name: "Donation" },
  { id: 2, name: "Income" },
  { id: 3, name: "Expense" },
  { id: 4, name: "Compensation" },
  { id: 5, name: "Grant" },
  { id: 6, name: "Tax" },
  { id: 7, name: "Transfer In" },
  { id: 8, name: "Transfer Out" },
];
export const contactTypes: Array<{ id: ContactType; name: string }> = [
  { id: 1, name: "Donor" },
  { id: 2, name: "External" },
  { id: 3, name: "Missionary" },
  { id: 4, name: "Staff" },
  { id: 5, name: "Admin" },
];
export const accountTypes: Array<{ id: AccountType; name: string }> = [
  { id: 1, name: "Operating" },
  { id: 2, name: "Benevolence" },
  { id: 3, name: "Ministry" },
];

export const engagementTypes: Array<{ id: EngagementType; name: string }> = [
  { id: 1, name: "In Person" },
  { id: 2, name: "Phone" },
  { id: 3, name: "Text" },
  { id: 4, name: "Email" },
  { id: 5, name: "Mail" },
];

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
  { name: "Transactions", href: "/transactions" },
  { name: "Contacts", href: "/contacts" },
  { name: "Request Reimbursement", href: "/reimbursements/new" },
  { name: "Add Engagement", href: "/engagements/new" },
] as const;

export const userNavLinks: ReadonlyArray<NavLink> = [] as const;

export const adminNavLinks: ReadonlyArray<NavLink> = [
  { name: "Add Income", href: "/income/new" },
  { name: "Add Expense", href: "/expense/new" },
  { name: "Add Transfer", href: "/transfer/new" },
  { name: "Accounts", href: "/accounts" },
] as const;

export const superAdminNavLinks: ReadonlyArray<NavLink> = [{ name: "Users", href: "/users" }] as const;
