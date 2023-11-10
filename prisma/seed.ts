import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function seed() {
  const email = "paul@remix.run";

  // cleanup the existing database
  await prisma.user.delete({ where: { email } }).catch(() => {
    // no worries if it doesn't exist yet
  });

  const org = await prisma.organization.create({ data: { name: "Alliance 436" } });

  const hashedPassword = await bcrypt.hash("password", 10);

  await prisma.user.create({
    data: {
      role: "SUPERADMIN",
      email,
      password: {
        create: {
          hash: hashedPassword,
        },
      },
    },
  });

  const user = await prisma.user.create({
    data: {
      role: "USER",
      email: "test@example.com",
      password: {
        create: {
          hash: hashedPassword,
        },
      },
      firstName: "Jessica",
      lastName: "Caudle",
    },
  });

  await prisma.account.create({
    data: {
      name: "Jessica Caudle",
      organizationId: org.id,
      userId: user.id,
    },
  });

  await prisma.donor.create({
    data: {
      name: "Mr. Donor",
      email: "mr@donor.com",
      phone: "555-555-5555",
    },
  });

  console.log(`Database has been seeded. 🌱`);
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
