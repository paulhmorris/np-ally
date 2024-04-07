import type { PasswordReset, User } from "@prisma/client";
import dayjs from "dayjs";

import { db } from "~/integrations/prisma.server";

export function getPasswordResetByToken(token: PasswordReset["token"]) {
  return db.passwordReset.findUnique({
    where: { token },
    select: { expiresAt: true, userId: true },
  });
}

export function getPasswordResetByUserId(userId: User["id"]) {
  return db.passwordReset.findFirst({
    where: { userId, expiresAt: { gte: new Date() } },
    select: { id: true, expiresAt: true },
  });
}

export function getCurrentPasswordReset({ userId }: { userId: User["id"] }) {
  return db.passwordReset.findFirst({
    where: { userId, expiresAt: { gte: new Date() } },
    select: { id: true, expiresAt: true },
  });
}

export function expirePasswordReset(token: PasswordReset["token"]) {
  return db.passwordReset.updateMany({
    where: { token },
    data: { expiresAt: new Date(0), usedAt: new Date() },
  });
}

export async function generatePasswordReset(username: User["username"]) {
  const user = await db.user.findUniqueOrThrow({ where: { username } });
  return db.passwordReset.create({
    data: {
      expiresAt: dayjs().add(15, "minute").toDate(),
      user: { connect: { id: user.id } },
    },
  });
}

export function deletePasswordReset(token: PasswordReset["token"]) {
  return db.passwordReset.delete({ where: { token } });
}
