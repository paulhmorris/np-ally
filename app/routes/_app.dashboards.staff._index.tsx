import { UserRole } from "@prisma/client";
import { type LoaderFunctionArgs, type MetaFunction } from "@remix-run/node";
import { typedjson, useTypedLoaderData } from "remix-typedjson";

import { ReimbursementRequestsList } from "~/components/admin/reimbursement-requests-list";
import { ErrorComponent } from "~/components/error-component";
import { PageContainer } from "~/components/page-container";
import { PageHeader } from "~/components/page-header";
import { AccountBalanceCard } from "~/components/users/balance-card";
import { prisma } from "~/integrations/prisma.server";
import { requireUser } from "~/lib/session.server";
import { useUser } from "~/lib/utils";

export const meta: MetaFunction = () => [{ title: "Home • Alliance 436" }];

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireUser(request);

  const total = await prisma.transaction.aggregate({
    where: {
      account: {
        userId: user.id,
      },
    },
    _sum: { amountInCents: true },
  });

  const reimbursementRequests = await prisma.reimbursementRequest.findMany({
    where: {
      userId: user.id,
      status: "PENDING",
    },
    include: {
      account: true,
      user: {
        include: { contact: true },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return typedjson({ total: total._sum.amountInCents, reimbursementRequests });
}

export default function Index() {
  const user = useUser();
  const { total, reimbursementRequests } = useTypedLoaderData<typeof loader>();

  return (
    <>
      <PageHeader title="Home" />
      <PageContainer>
        {user.role === UserRole.USER ? (
          <div className="space-y-5">
            <div className="max-w-[320px]">
              <AccountBalanceCard totalCents={total} />
            </div>
            {reimbursementRequests.length > 0 ? (
              <div className="max-w-2xl">
                <ReimbursementRequestsList requests={reimbursementRequests} />
              </div>
            ) : null}
          </div>
        ) : null}
      </PageContainer>
    </>
  );
}

export function ErrorBoundary() {
  return <ErrorComponent />;
}
