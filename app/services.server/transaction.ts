import { Organization } from "@prisma/client";

import { db } from "~/integrations/prisma.server";

export function getTransactionItemMethods(orgId: Organization["id"]) {
  return db.transactionItemMethod.findMany({ where: { OR: [{ orgId }, { orgId: null }] } });
}
