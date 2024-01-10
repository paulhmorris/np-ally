import { Password, User } from "@prisma/client";

import { withServiceErrorHandling } from "~/services/helpers";
import { PasswordService } from "~/services/PasswordService.server";
import { UserService } from "~/services/UserService.server";

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
      const userWithPassword = await UserService.getUserByUsername(username, {
        include: { password: true },
      });

      if (!userWithPassword || !userWithPassword.password) {
        return null;
      }

      const isValid = await PasswordService.comparePasswords(password, userWithPassword.password.hash);

      if (!isValid) {
        return null;
      }

      const { password: _password, ...userWithoutPassword } = userWithPassword;

      return userWithoutPassword;
    }) as Promise<User | null>;
  }
}

export const AuthService = new Service();
