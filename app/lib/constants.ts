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

export const navLinks: ReadonlyArray<{
  name: string;
  href: string;
}> = [
  { name: "Add Donation", href: "/transactions/new" },
  { name: "Request Reimbursement", href: "/reimbursements/new" },
  { name: "Accounts", href: "/accounts" },
  { name: "Donors", href: "/donors" },
  { name: "Reimbursements", href: "/reimbursements" },
  { name: "Users", href: "/users" },
] as const;
