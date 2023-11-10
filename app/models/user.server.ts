import type { Password, Prisma, User } from "@prisma/client";
import bcrypt from "bcryptjs";

import { prisma } from "~/utils/db.server";

export type { User } from "@prisma/client";

export async function getUserById(id: User["id"]) {
  return prisma.user.findUnique({
    where: { id },
  });
}

export async function getUserByEmail(email: User["email"]) {
  return prisma.user.findUnique({ where: { email } });
}

export async function createUser(data: Prisma.UserUncheckedCreateInput & { password: Password["hash"] }) {
  const { password, ...rest } = data;
  const hashedPassword = await bcrypt.hash(password, 10);

  return prisma.user.create({
    data: {
      ...rest,
      password: {
        create: {
          hash: hashedPassword,
        },
      },
    },
  });
}

export async function resetUserPassword({ userId, password }: { userId: User["id"]; password: string }) {
  const hash = await bcrypt.hash(password, 10);
  return prisma.user.update({
    where: { id: userId },
    data: {
      password: { update: { hash } },
    },
  });
}

export async function setupUserPassword({ userId, password }: { userId: User["id"]; password: string }) {
  const hash = await bcrypt.hash(password, 10);
  return prisma.user.update({
    where: { id: userId },
    data: {
      password: {
        create: { hash },
      },
    },
  });
}

export async function deleteUserByEmail(email: User["email"]) {
  return prisma.user.delete({ where: { email } });
}

export async function verifyLogin(email: User["email"], password: Password["hash"]) {
  const userWithPassword = await prisma.user.findUnique({
    where: { email },
    include: { password: true },
  });

  if (!userWithPassword || !userWithPassword.password) {
    return null;
  }

  const isValid = await bcrypt.compare(password, userWithPassword.password.hash);

  if (!isValid) {
    return null;
  }

  const { password: _password, ...userWithoutPassword } = userWithPassword;

  return userWithoutPassword;
}
