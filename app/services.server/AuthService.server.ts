import { Password, User } from "@prisma/client";

import { db } from "~/integrations/prisma.server";
import { withServiceErrorHandling } from "~/services.server/helpers";
import { comparePasswords } from "~/services.server/password";

interface IAuthService {
  verifyLogin({
    username,
    password,
  }: {
    username: NonNullable<User["username"]>;
    password: Password["hash"];
  }): Promise<User | null>;
}

class Service implements IAuthService {
  async verifyLogin({ username, password }: { username: NonNullable<User["username"]>; password: Password["hash"] }) {
    return withServiceErrorHandling(async () => {
      const userWithPassword = await db.user.findUnique({
        where: { username },
        include: { password: true },
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
    }) as Promise<User | null>;
  }
}

export const AuthService = new Service();
