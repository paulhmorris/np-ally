import { faker } from "@faker-js/faker";
import { UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";

import prisma from "test/e2e/helpers/prisma";
import { ContactType } from "~/lib/constants";

export async function createAdmin() {
  const user = {
    firstName: "Admin",
    lastName: "E2E",
    username: `e2e-admin-${faker.internet.email().toLowerCase()}`,
    password: faker.internet.password(),
  };
  const org = await prisma.organization.findFirst();
  if (!org) {
    throw new Error("No organization found. Please create one.");
  }
  const createdUser = await prisma.user.create({
    data: {
      role: UserRole.ADMIN,
      username: user.username,
      password: {
        create: {
          hash: await bcrypt.hash(user.password, 10),
        },
      },
      contact: {
        create: {
          orgId: org.id,
          typeId: ContactType.Staff,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.username,
        },
      },
    },
  });
  return {
    ...createdUser,
    password: user.password,
  };
}
