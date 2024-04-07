import { LoaderFunctionArgs } from "@remix-run/node";
import { MetaFunction } from "@remix-run/react";
import { typedjson, useTypedLoaderData } from "remix-typedjson";

import { PageContainer } from "~/components/page-container";
import { PageHeader } from "~/components/page-header";
import { ReimbursementRequestsTable } from "~/components/reimbursements/reimbursement-requests-table";
import { db } from "~/integrations/prisma.server";
import { SessionService } from "~/services.server/session";

export const meta: MetaFunction = () => [{ title: "Reimbursement Requests" }];

export async function loader({ request }: LoaderFunctionArgs) {
  await SessionService.requireAdmin(request);
  const orgId = await SessionService.requireOrgId(request);

  const requests = await db.reimbursementRequest.findMany({
    where: { orgId },
    include: {
      user: {
        include: {
          contact: true,
        },
      },
      account: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return typedjson({ requests });
}

export default function ReimbursementRequestsList() {
  const { requests } = useTypedLoaderData<typeof loader>();
  return (
    <>
      <PageHeader title="Reimbursement Requests" />
      <PageContainer>
        <ReimbursementRequestsTable data={requests} />
      </PageContainer>
    </>
  );
}
