import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { typedjson, useTypedLoaderData } from "remix-typedjson";

import { PageHeader } from "~/components/common/page-header";
import { ErrorComponent } from "~/components/error-component";
import { PageContainer } from "~/components/page-container";
import { TransactionsTable } from "~/components/transactions/transactions-table";
import { db } from "~/integrations/prisma.server";
import { SessionService } from "~/services.server/session";

export const meta: MetaFunction = () => [{ title: "Transactions" }];

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await SessionService.requireUser(request);
  const orgId = await SessionService.requireOrgId(request);

  const transactions = await db.transaction.findMany({
    where: {
      orgId,
      account: user.isMember
        ? {
            user: {
              id: user.id,
            },
          }
        : undefined,
    },
    select: {
      id: true,
      date: true,
      amountInCents: true,
      description: true,
      contact: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
      account: {
        select: {
          id: true,
          code: true,
          description: true,
        },
      },
    },
    orderBy: [{ date: "desc" }, { account: { code: "asc" } }],
  });
  return typedjson({ transactions });
}

export default function TransactionsIndexPage() {
  const { transactions } = useTypedLoaderData<typeof loader>();
  return (
    <>
      <PageHeader title="Transactions" />
      <PageContainer>
        <TransactionsTable data={transactions} />
      </PageContainer>
    </>
  );
}

export function ErrorBoundary() {
  return <ErrorComponent />;
}
