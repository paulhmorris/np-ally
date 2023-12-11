import { ReimbursementRequestStatus, UserRole } from "@prisma/client";
import { type LoaderFunctionArgs, type MetaFunction } from "@remix-run/node";
import { redirect, typedjson, useTypedLoaderData } from "remix-typedjson";

import { ReimbursementRequestsList } from "~/components/admin/reimbursement-requests-list";
import { ErrorComponent } from "~/components/error-component";
import { PageContainer } from "~/components/page-container";
import { PageHeader } from "~/components/page-header";
import { AccountBalanceCard } from "~/components/users/balance-card";
import { prisma } from "~/integrations/prisma.server";
import { requireUser } from "~/lib/session.server";
import { formatCentsAsDollars } from "~/lib/utils";

export const meta: MetaFunction = () => [{ title: "Home • Alliance 436" }];

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireUser(request);
  if (user.role === UserRole.USER) {
    return redirect("/dashboards/staff");
  }

  const total = await prisma.transaction.aggregate({
    _sum: { amountInCents: true },
  });

  const reimbursementRequests = await prisma.reimbursementRequest.findMany({
    where: {
      userId: user.id,
      status: ReimbursementRequestStatus.PENDING,
    },
    include: {
      account: true,
      user: {
        include: { contact: true },
      },
    },
  });

  return typedjson({ total, reimbursementRequests });
}

export default function Index() {
  const { total, reimbursementRequests } = useTypedLoaderData<typeof loader>();

  return (
    <>
      <PageHeader title="Home" />
      <PageContainer>
        <div className="space-y-5">
          <div className="max-w-[320px]">
            <AccountBalanceCard total={formatCentsAsDollars(total._sum.amountInCents)} />
          </div>
          <div className="max-w-2xl">
            <ReimbursementRequestsList requests={reimbursementRequests} />
          </div>
        </div>
      </PageContainer>
    </>
  );
}

export function ErrorBoundary() {
  return <ErrorComponent />;
}
