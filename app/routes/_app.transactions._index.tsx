import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { Link } from "@remix-run/react";
import { IconPlus } from "@tabler/icons-react";
import { typedjson, useTypedLoaderData } from "remix-typedjson";

import { PageContainer } from "~/components/page-container";
import { PageHeader } from "~/components/page-header";
import { TransactionsTable } from "~/components/transactions/transactions-table";
import { Button } from "~/components/ui/button";
import { prisma } from "~/integrations/prisma.server";
import { requireUser } from "~/lib/session.server";

export const meta: MetaFunction = () => [{ title: "Users • Alliance 436" }];

export async function loader({ request }: LoaderFunctionArgs) {
  await requireUser(request, ["ADMIN", "SUPERADMIN"]);
  const transactions = await prisma.transaction.findMany({
    include: { account: true },
    orderBy: { createdAt: "desc" },
  });
  return typedjson({ transactions });
}

export default function TransactionsIndexPage() {
  const { transactions } = useTypedLoaderData<typeof loader>();
  return (
    <>
      <PageHeader title="Transactions">
        <Button asChild>
          <Link to="/transactions/new">
            <IconPlus className="mr-2 h-5 w-5" />
            <span>New Transaction</span>
          </Link>
        </Button>
      </PageHeader>

      <PageContainer>
        <TransactionsTable transactions={transactions} />
      </PageContainer>
    </>
  );
}
