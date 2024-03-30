import { Organization } from "@prisma/client";

import { db } from "~/integrations/prisma.server";

export function getContactTypes(orgId: Organization["id"]) {
  return db.contactType.findMany({ where: { OR: [{ orgId }, { orgId: null }] } });
}
