import { Password, User } from "@prisma/client";
import bcrypt from "bcryptjs";

import { db } from "~/integrations/prisma.server";

export function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export function comparePasswords(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function verifyLogin({
  username,
  password,
}: {
  username: NonNullable<User["username"]>;
  password: Password["hash"];
}) {
  const userWithPassword = await db.user.findUnique({
    where: {
      // Not deactivated
      isActive: true,
      username,
    },
    include: {
      password: true,
      memberships: true,
    },
  });

  if (!userWithPassword || !userWithPassword.password) {
    return null;
  }

  const isValid = await comparePasswords(password, userWithPassword.password.hash);

  if (!isValid) {
    return null;
  }

  const { password: _password, ...userWithoutPassword } = userWithPassword;

  return userWithoutPassword;
}
