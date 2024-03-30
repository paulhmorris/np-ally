import { Organization } from "@prisma/client";

import { db } from "~/integrations/prisma.server";

export function getEngagementTypes(orgId: Organization["id"]) {
  return db.engagementType.findMany({ where: { OR: [{ orgId }, { orgId: null }] } });
}
