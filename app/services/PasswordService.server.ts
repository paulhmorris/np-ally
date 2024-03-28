import { Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";

import { db } from "~/integrations/prisma.server";
import { withServiceErrorHandling } from "~/services/helpers";
import { Operation } from "~/services/types";

type Model = typeof db.passwordReset;
type PasswordResult<M extends Model, T, O extends Operation> = Promise<Prisma.Result<M, T, O>>;

interface IPasswordService {
  hashPassword(password: string): Promise<string>;
  comparePasswords(password: string, hash: string): Promise<boolean>;
  generatePasswordReset<T extends Omit<Prisma.Args<Model, "create">, "data">>(
    username: string,
    args?: T,
  ): PasswordResult<Model, T, "create">;
  getPasswordResetByToken<T extends Prisma.Args<Model, "findUnique">>(
    token: string,
    args?: T,
  ): PasswordResult<Model, T, "findUnique">;
  getPasswordResetByUserId<T extends Prisma.Args<Model, "findFirst">>(
    userId: string,
    args?: T,
  ): PasswordResult<Model, T, "findFirst">;
  expirePasswordReset<T extends Prisma.Args<Model, "updateMany">>(
    token: string,
    args?: T,
  ): PasswordResult<Model, T, "updateMany">;
  deletePasswordReset<T extends Prisma.Args<Model, "delete">>(
    token: string,
    args?: T,
  ): PasswordResult<Model, T, "delete">;
}

class Service implements IPasswordService {
  public async hashPassword(password: string) {
    return withServiceErrorHandling(async () => {
      const hash = await bcrypt.hash(password, 10);
      return hash;
    }) as Promise<string>;
  }

  public async comparePasswords(password: string, hash: string) {
    return withServiceErrorHandling(async () => {
      return bcrypt.compare(password, hash);
    }) as Promise<boolean>;
  }

  public async generatePasswordReset<T extends Omit<Prisma.Args<Model, "create">, "data">>(username: string, args?: T) {
    return withServiceErrorHandling<Model, T, "create">(async () => {
      const user = await db.user.findUnique({ where: { username } });
      const reset = await db.passwordReset.create({
        ...args,
        data: {
          expiresAt: new Date(Date.now() + 15 * 60 * 1000),
          user: {
            connect: {
              id: user?.id,
            },
          },
        },
      });
      return reset;
    });
  }

  public async getPasswordResetByToken<T extends Prisma.Args<Model, "findUnique">>(token: string, args?: T) {
    return withServiceErrorHandling<Model, T, "findUnique">(async () => {
      const reset = await db.passwordReset.findUnique({
        ...args,
        where: { token, ...args?.where },
      });
      return reset;
    });
  }

  public async getPasswordResetByUserId<T extends Prisma.Args<Model, "findFirst">>(userId: string, args?: T) {
    return withServiceErrorHandling<Model, T, "findFirst">(async () => {
      const reset = await db.passwordReset.findFirst({
        ...args,
        where: { userId, expiresAt: { gte: new Date() }, ...args?.where },
      });
      return reset;
    });
  }

  public async expirePasswordReset<T extends Prisma.Args<Model, "updateMany">>(token: string, args?: T) {
    return withServiceErrorHandling<Model, T, "updateMany">(async () => {
      const reset = await db.passwordReset.updateMany({
        ...args,
        where: { token, ...args?.where },
        data: { expiresAt: new Date(0), usedAt: new Date() },
      });
      return reset;
    });
  }

  public async deletePasswordReset<T extends Prisma.Args<Model, "delete">>(id: string, args?: T) {
    return withServiceErrorHandling<Model, T, "delete">(async () => {
      const reset = await db.passwordReset.delete({ ...args, where: { id, ...args?.where } });
      return reset;
    });
  }
}

export const PasswordService = new Service();
