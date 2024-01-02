import type { Contact, Password, Prisma, User } from "@prisma/client";
import bcrypt from "bcryptjs";

import { prisma } from "~/integrations/prisma.server";

export type { User } from "@prisma/client";

export async function getUserById(id: User["id"]) {
  return prisma.user.findUnique({
    where: { id },
    include: { contact: true },
  });
}

export async function getUserByEmail(email: NonNullable<Contact["email"]>) {
  const contact = await prisma.contact.findUniqueOrThrow({ where: { email } });
  return prisma.user.findUnique({
    where: { contactId: contact.id },
  });
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

export async function resetOrSetupUserPassword({ userId, password }: { userId: User["id"]; password: string }) {
  const hash = await bcrypt.hash(password, 10);
  return prisma.user.update({
    where: { id: userId },
    data: {
      password: {
        upsert: {
          create: { hash },
          update: { hash },
        },
      },
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

export async function deleteUserByEmail(email: NonNullable<Contact["email"]>) {
  const contact = await prisma.contact.findUniqueOrThrow({ where: { email } });
  return prisma.user.delete({ where: { contactId: contact.id } });
}

export async function verifyLogin(username: NonNullable<User["username"]>, password: Password["hash"]) {
  const userWithPassword = await prisma.user.findUnique({
    where: { username },
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
