import { MembershipRole, PrismaClient, UserRole } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.$transaction(async (tx) => {
    // Get the default organization
    let defaultOrg = await tx.organization.findFirst();
    if (!defaultOrg) {
      defaultOrg = await tx.organization.create({
        data: {
          name: "Alliance 436",
          host: "alliance436.org",
        },
      });
    }

    const users = await tx.user.findMany({
      select: {
        id: true,
        role: true,
        contactId: true,
        account: {
          select: {
            id: true,
          },
        },
      },
    });
    for (const user of users) {
      // Subscribe each user to their account
      if (user.account) {
        await tx.accountSubscription.upsert({
          where: {
            accountId_subscriberId: {
              accountId: user.account.id,
              subscriberId: user.contactId,
            },
          },
          update: { orgId: defaultOrg.id },
          create: {
            orgId: defaultOrg.id,
            accountId: user.account.id,
            subscriberId: user.contactId,
          },
        });
      }
      // Create a membership for each user
      await tx.user.update({
        where: { id: user.id },
        data: {
          memberships: {
            create: {
              role: user.role === UserRole.ADMIN ? MembershipRole.ADMIN : MembershipRole.MEMBER,
              orgId: defaultOrg.id,
            },
          },
        },
      });
    }

    // Link everything to the default organization
    await tx.account.updateMany({ data: { orgId: defaultOrg.id } });
    await tx.accountSubscription.updateMany({ data: { orgId: defaultOrg.id } });
    await tx.transaction.updateMany({ data: { orgId: defaultOrg.id } });
    await tx.transactionItem.updateMany({ data: { orgId: defaultOrg.id } });
    await tx.reimbursementRequest.updateMany({ data: { orgId: defaultOrg.id } });
    await tx.receipt.updateMany({ data: { orgId: defaultOrg.id } });
    await tx.contact.updateMany({ data: { orgId: defaultOrg.id } });
    await tx.contactAssigment.updateMany({ data: { orgId: defaultOrg.id } });
    await tx.address.updateMany({ data: { orgId: defaultOrg.id } });
    await tx.engagement.updateMany({ data: { orgId: defaultOrg.id } });
    await tx.announcement.updateMany({ data: { orgId: defaultOrg.id } });
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => await prisma.$disconnect());
