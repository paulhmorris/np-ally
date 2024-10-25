import { Prisma, TransactionItemTypeDirection } from "@prisma/client";
import {
  IconAffiliate,
  IconBuildingBank,
  IconCoin,
  IconCreditCard,
  IconCreditCardPay,
  IconCreditCardRefund,
  IconFileSpreadsheet,
  IconTransfer,
  IconUserHeart,
  IconUsers,
  IconUsersGroup,
} from "@tabler/icons-react";

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

export enum TransactionCategory {
  Professional_Services = 1,
  Supplies = 2,
  Travel = 3,
  Meals = 4,
  Taxes = 5,
  Rent = 6,
  Utilities = 7,
  Insurance = 8,
  Marketing = 9,
  Training = 10,
  Equipment = 11,
  Repairs = 12,
  Miscellaneous = 13,
  Salaries = 14,
  Fees = 15,
  Donations = 16,
  Grants = 17,
  Other = 18,
}

export const transactionCategories: Array<{ id: TransactionCategory; name: string }> = [
  { id: 1, name: "Professional Services" },
  { id: 2, name: "Supplies" },
  { id: 3, name: "Travel" },
  { id: 4, name: "Meals" },
  { id: 5, name: "Taxes" },
  { id: 6, name: "Rent" },
  { id: 7, name: "Utilities" },
  { id: 8, name: "Insurance" },
  { id: 9, name: "Marketing" },
  { id: 10, name: "Training" },
  { id: 11, name: "Equipment" },
  { id: 12, name: "Repairs" },
  { id: 13, name: "Miscellaneous" },
  { id: 14, name: "Salaries" },
  { id: 15, name: "Fees" },
  { id: 16, name: "Donations" },
  { id: 17, name: "Grants" },
  { id: 18, name: "Other" },
] as const;

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

export interface AppNavLink {
  name: string;
  to: string;
  end: boolean;
  icon: typeof IconCreditCard;
}

export const globalNavLinks: ReadonlyArray<AppNavLink> = [
  { name: "Transactions", to: "/transactions", end: false, icon: IconCreditCard },
  { name: "Contacts", to: "/contacts", end: false, icon: IconUsers },
  { name: "Engagements", to: "/engagements", end: true, icon: IconUserHeart },
  { name: "Reimbursement", to: "/reimbursements/new", end: false, icon: IconCoin },
] as const;

export const userNavLinks: ReadonlyArray<AppNavLink> = [] as const;

export const adminNavLinks: ReadonlyArray<AppNavLink> = [
  { name: "Add Income", to: "/income/new", end: false, icon: IconCreditCardRefund },
  { name: "Add Expense", to: "/expense/new", end: false, icon: IconCreditCardPay },
  { name: "Add Transfer", to: "/transfer/new", end: false, icon: IconTransfer },
  { name: "Accounts", to: "/accounts", end: false, icon: IconBuildingBank },
  { name: "Users", to: "/users", end: false, icon: IconUsersGroup },
  { name: "Reimbursements", to: "/reimbursements", end: true, icon: IconCoin },
  // { name: "Receipts", to: "/receipts", end: true, icon: IconReceipt },
  { name: "Organization", to: "/organization/settings", end: false, icon: IconAffiliate },
  { name: "Reports", to: "/reports", end: true, icon: IconFileSpreadsheet },
] as const;

export const superAdminNavLinks: ReadonlyArray<AppNavLink> = [] as const;
