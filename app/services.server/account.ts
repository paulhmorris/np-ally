import { Organization } from "@prisma/client";

import { db } from "~/integrations/prisma.server";

export function getAccountTypes(orgId: Organization["id"]) {
  return db.accountType.findMany({ where: { OR: [{ orgId }, { orgId: null }] } });
}
