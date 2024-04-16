import { MembershipRole, UserRole } from "@prisma/client";

import { useOptionalUser } from "~/hooks/useOptionalUser";

export function useUser() {
  const maybeUser = useOptionalUser();
  if (!maybeUser) {
    throw new Error(
      "No user found in root loader, but user is required by useUser. If user is optional, try useOptionalUser instead.",
    );
  }
  if (!maybeUser.role) {
    throw new Error("User has no role in root loader.");
  }

  return {
    ...maybeUser,
    isMember: maybeUser.role === MembershipRole.MEMBER,
    isAdmin: maybeUser.role === MembershipRole.ADMIN || maybeUser.systemRole === UserRole.SUPERADMIN,
    isSuperAdmin: maybeUser.systemRole === UserRole.SUPERADMIN,
  } as Omit<typeof maybeUser, "role"> & {
    role: MembershipRole;
    isMember: boolean;
    isAdmin: boolean;
    isSuperAdmin: boolean;
  };
}
