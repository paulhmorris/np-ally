import { LoaderFunctionArgs } from "@remix-run/node";
import { MetaFunction } from "@remix-run/react";
import { typedjson, useTypedLoaderData } from "remix-typedjson";

import { PageContainer } from "~/components/page-container";
import { PageHeader } from "~/components/page-header";
import { ReimbursementRequestsTable } from "~/components/reimbursements/reimbursement-requests-table";
import { prisma } from "~/integrations/prisma.server";
import { SessionService } from "~/services/SessionService.server";

export const meta: MetaFunction = () => [{ title: "Reimbursement Requests | Alliance 436" }];

export async function loader({ request }: LoaderFunctionArgs) {
  await SessionService.requireAdmin(request);

  const requests = await prisma.reimbursementRequest.findMany({
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
