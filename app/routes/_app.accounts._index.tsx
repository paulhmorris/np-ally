import { Prisma } from "@prisma/client";
import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { Link } from "@remix-run/react";
import { IconPlus } from "@tabler/icons-react";
import { typedjson, useTypedLoaderData } from "remix-typedjson";

import { AccountsTable } from "~/components/accounts/accounts-table";
import { PageHeader } from "~/components/common/page-header";
import { ErrorComponent } from "~/components/error-component";
import { PageContainer } from "~/components/page-container";
import { Button } from "~/components/ui/button";
import { db } from "~/integrations/prisma.server";
import { Sentry } from "~/integrations/sentry";
import { SessionService } from "~/services.server/session";

export const meta: MetaFunction = () => [{ title: "Accounts" }];

export const accountsIndexSelect: Prisma.AccountSelect = {
  id: true,
  code: true,
  description: true,
  transactions: {
    select: {
      amountInCents: true,
    },
  },
  type: {
    select: {
      name: true,
    },
  },
};
export async function loader({ request }: LoaderFunctionArgs) {
  await SessionService.requireAdmin(request);
  const orgId = await SessionService.requireOrgId(request);

  try {
    const accounts = await db.account.findMany({
      where: { orgId },
      select: accountsIndexSelect,
      orderBy: { code: "asc" },
    });

    const accountsWithBalance = accounts.map((account) => {
      const balance = account.transactions.reduce((acc, transaction) => acc + transaction.amountInCents, 0);
      return { ...account, balance };
    });

    return typedjson({ accounts: accountsWithBalance });
  } catch (error) {
    console.error(error);
    Sentry.captureException(error);
    throw error;
  }
}

export default function AccountsIndexPage() {
  const { accounts } = useTypedLoaderData<typeof loader>();
  return (
    <>
      <PageHeader title="Accounts">
        <Button asChild>
          <Link to="/accounts/new">
            <IconPlus className="mr-2 h-5 w-5" />
            <span>New Account</span>
          </Link>
        </Button>
      </PageHeader>

      <PageContainer>
        <AccountsTable data={accounts} />
      </PageContainer>
    </>
  );
}

export function ErrorBoundary() {
  return <ErrorComponent />;
}
