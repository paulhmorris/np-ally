import { Prisma, User } from "@prisma/client";
import { DefaultArgs } from "@prisma/client/runtime/library";
import bcrypt from "bcryptjs";

import { db } from "~/integrations/prisma.server";
import { withServiceErrorHandling } from "~/services/helpers";
import { PasswordService } from "~/services/PasswordService.server";
import { OmitFromWhere, Operation } from "~/services/types";

type Model = typeof db.user;
type UserResult<T, O extends Operation> = Promise<Prisma.Result<Model, T, O>>;

interface IUserService {
  getUserById<T extends OmitFromWhere<Prisma.Args<Model, "findUnique">, "id">>(
    id: User["id"],
    args: T,
  ): UserResult<T, "findUnique">;
  getUserByUsername<T extends OmitFromWhere<Prisma.Args<Model, "findUnique">, "username">>(
    username: User["username"],
    args: T,
  ): UserResult<T, "findUnique">;
  resetOrSetupUserPassword<T extends Prisma.Args<Model, "update">>(args: {
    userId: User["id"];
    password: string;
  }): UserResult<T, "update">;
  createUser<T extends Prisma.Args<Model, "create">>(password: string, args: T): UserResult<T, "create">;
  updateUser<T extends OmitFromWhere<Prisma.Args<Model, "update">, "id">>(
    id: User["id"],
    args: T,
  ): UserResult<T, "update">;
  deleteUser<T extends OmitFromWhere<Prisma.Args<Model, "delete">, "id">>(
    id: User["id"],
    args: T,
  ): UserResult<T, "delete">;
  deleteUserByUsername<T extends OmitFromWhere<Prisma.Args<Model, "delete">, "id">>(
    email: User["username"],
    args: T,
  ): UserResult<T, "delete">;
}

class Service implements IUserService {
  resetOrSetupUserPassword<T extends Prisma.UserUpdateArgs<DefaultArgs>>({
    userId,
    password,
  }: {
    userId: User["id"];
    password: string;
  }) {
    return withServiceErrorHandling<Model, T, "update">(async () => {
      const hashedPassword = await PasswordService.hashPassword(password);

      const user = await db.user.update({
        where: { id: userId },
        data: {
          password: {
            upsert: {
              create: { hash: hashedPassword },
              update: { hash: hashedPassword },
            },
          },
        },
      });
      return user;
    });
  }
  public async getUserById<T extends OmitFromWhere<Prisma.Args<Model, "findUnique">, "id">>(id: User["id"], args?: T) {
    return withServiceErrorHandling<Model, T, "findUnique">(async () => {
      const user = await db.user.findUnique({ ...args, where: { id, ...args?.where } });
      return user;
    });
  }

  public async getUserByUsername<T extends OmitFromWhere<Prisma.Args<Model, "findUnique">, "username">>(
    username: User["username"],
    args?: T,
  ) {
    return withServiceErrorHandling<Model, T, "findUnique">(async () => {
      const user = await db.user.findUnique({ ...args, where: { username, ...args?.where } });
      return user;
    });
  }

  public async createUser<T extends Prisma.Args<Model, "create">>(password: string, args: T) {
    return withServiceErrorHandling<Model, T, "create">(async () => {
      const hashedPassword = await bcrypt.hash(password, 10);

      const user = await db.user.create({
        ...args,
        data: {
          ...args.data,
          password: {
            create: {
              hash: hashedPassword,
            },
          },
        },
      });
      return user;
    });
  }

  public async updateUser<T extends OmitFromWhere<Prisma.Args<Model, "update">, "id">>(id: User["id"], args: T) {
    return withServiceErrorHandling<Model, T, "update">(async () => {
      const user = await db.user.update({ ...args, where: { id, ...args.where } });
      return user;
    });
  }

  public async deleteUser<T extends OmitFromWhere<Prisma.Args<Model, "delete">, "id">>(id: User["id"], args?: T) {
    return withServiceErrorHandling<Model, T, "delete">(async () => {
      const user = await db.user.delete({ ...args, where: { id, ...args?.where } });
      return user;
    });
  }

  public async deleteUserByUsername<T extends OmitFromWhere<Prisma.Args<Model, "delete">, "username">>(
    username: User["username"],
    args?: T,
  ) {
    return withServiceErrorHandling<Model, T, "delete">(async () => {
      const user = await db.user.delete({ ...args, where: { username, ...args?.where } });
      return user;
    });
  }
}

export const UserService = new Service();
