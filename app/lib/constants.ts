import { Prisma, TransactionItemTypeDirection } from "@prisma/client";

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
  Outreach = 5,
  Organization = 6,
  Donor_and_Missionary = 7,
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
  Other_Incoming = 9,
  Other_Outgoing = 10,
  Fee = 11,
}

export enum TransactionItemMethod {
  PayPal = 1,
  Check = 2,
  ACH = 3,
  Credit_Card = 4,
  Debit_Card = 5,
  Tithely = 6,
  Other = 7,
}

export const transactionItemMethods: Array<{ id: TransactionItemMethod; name: string }> = [
  { id: 1, name: "PayPal" },
  { id: 2, name: "Check" },
  { id: 3, name: "ACH" },
  { id: 4, name: "Credit Card" },
  { id: 5, name: "Debit Card" },
  { id: 6, name: "Tithe.ly" },
  { id: 7, name: "Other" },
];

export const transactionItemTypes: Array<{
  id: TransactionItemType;
  name: string;
  direction: TransactionItemTypeDirection;
}> = [
  { id: 1, name: "Donation", direction: TransactionItemTypeDirection.IN },
  { id: 2, name: "Income", direction: TransactionItemTypeDirection.IN },
  { id: 3, name: "Expense", direction: TransactionItemTypeDirection.OUT },
  { id: 4, name: "Compensation", direction: TransactionItemTypeDirection.OUT },
  { id: 5, name: "Grant", direction: TransactionItemTypeDirection.OUT },
  { id: 6, name: "Tax", direction: TransactionItemTypeDirection.OUT },
  { id: 7, name: "Transfer In", direction: TransactionItemTypeDirection.IN },
  { id: 8, name: "Transfer Out", direction: TransactionItemTypeDirection.OUT },
  { id: 9, name: "Other (Incoming)", direction: TransactionItemTypeDirection.IN },
  { id: 10, name: "Other (Outgoing)", direction: TransactionItemTypeDirection.OUT },
  { id: 11, name: "Fee", direction: TransactionItemTypeDirection.OUT },
];

export const contactTypes: Array<{ id: ContactType; name: string }> = [
  { id: 1, name: "Donor" },
  { id: 2, name: "External" },
  { id: 3, name: "Missionary" },
  { id: 4, name: "Staff" },
  { id: 5, name: "Outreach" },
  { id: 6, name: "Organization" },
  { id: 7, name: "Donor and Missionary" },
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

export const defaultAccounts: Array<Omit<Prisma.AccountUncheckedCreateInput, "orgId">> = [
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
  end: boolean;
}

export const globalNavLinks: ReadonlyArray<NavLink> = [
  { name: "Transactions", href: "/transactions", end: false },
  { name: "Contacts", href: "/contacts", end: false },
  { name: "Engagements", href: "/engagements", end: true },
  { name: "Add Engagement", href: "/engagements/new", end: false },
  { name: "Request Reimbursement", href: "/reimbursements/new", end: false },
] as const;

export const userNavLinks: ReadonlyArray<NavLink> = [] as const;

export const adminNavLinks: ReadonlyArray<NavLink> = [
  { name: "Add Income", href: "/income/new", end: false },
  { name: "Add Expense", href: "/expense/new", end: false },
  { name: "Add Transfer", href: "/transfer/new", end: false },
  { name: "Accounts", href: "/accounts", end: false },
  { name: "Users", href: "/users", end: false },
  { name: "Reimbursement Requests", href: "/reimbursements", end: true },
  { name: "Org Settings", href: "/organization/settings", end: false },
] as const;

export const superAdminNavLinks: ReadonlyArray<NavLink> = [] as const;
