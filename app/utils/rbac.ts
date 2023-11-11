import { UserRole } from "@prisma/client";

export const AccessRoles: Record<string, Readonly<Array<UserRole>>> = {
  NoUsers: ["ACCOUNTANT", "ADMIN", "OWNER", "SUPERADMIN"],
  SuperAdminOnly: ["SUPERADMIN"],
} as const;
