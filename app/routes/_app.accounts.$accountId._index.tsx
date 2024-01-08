import type { LoaderFunctionArgs } from "@remix-run/node";
import { Link, type MetaFunction } from "@remix-run/react";
import { IconCoins, IconExclamationCircle, IconUser } from "@tabler/icons-react";
import { typedjson, useTypedLoaderData } from "remix-typedjson";
import { setFormDefaults } from "remix-validated-form";
import invariant from "tiny-invariant";

import { AccountTransactionsTable } from "~/components/accounts/account-transactions-table";
import { ErrorComponent } from "~/components/error-component";
import { PageContainer } from "~/components/page-container";
import { PageHeader } from "~/components/page-header";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { AccountBalanceCard } from "~/components/users/balance-card";
import { prisma } from "~/integrations/prisma.server";
import { AccountType } from "~/lib/constants";
import { notFound } from "~/lib/responses.server";
import { SessionService } from "~/services/SessionService.server";

export const meta: MetaFunction = () => [{ title: "Account • Alliance 436" }];

export const loader = async ({ params, request }: LoaderFunctionArgs) => {
  await SessionService.requireAdmin(request);
  invariant(params.accountId, "accountId not found");

  const account = await prisma.account.findUnique({
    where: { id: params.accountId },
    include: {
      type: true,
      user: {
        include: { contact: true },
      },
      organization: true,
      transactions: {
        include: {
          contact: true,
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!account) throw notFound({ message: "Account not found" });

  const total = await prisma.transaction.aggregate({
    where: { accountId: account.id },
    _sum: { amountInCents: true },
  });

  return typedjson({
    total: total._sum.amountInCents,
    account,
    ...setFormDefaults("account-form", { ...account }),
  });
};

export default function AccountDetailsPage() {
  const { total, account } = useTypedLoaderData<typeof loader>();

  return (
    <>
      <PageHeader title={account.code}>
        <Button variant="outline" asChild>
          <Link to={`/accounts/${account.id}/edit`}>Edit</Link>
        </Button>
      </PageHeader>
      <div className="mt-4 flex flex-wrap items-center gap-2 sm:mt-1">
        <Badge variant="outline">
          <div>
            <IconCoins className="size-3" />
          </div>
          <span>{account.type.name}</span>
        </Badge>
        {account.user ? (
          <Link to={`/users/${account.user.id}`}>
            <Badge variant="secondary">
              <div>
                <IconUser className="size-3" />
              </div>
              {account.user.contact.firstName} {account.user.contact.lastName}
            </Badge>
          </Link>
        ) : // eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
        account.typeId === AccountType.Ministry ? (
          <Link to={`/accounts/${account.id}/edit`}>
            <Badge variant="secondary">
              <div>
                <IconExclamationCircle className="size-3 text-warning" />
              </div>
              <span>No linked user</span>
            </Badge>
          </Link>
        ) : null}
      </div>
      <PageContainer>
        <div className="max-w-md">
          <AccountBalanceCard totalCents={total} title={account.description} code={account.type.name} />
        </div>
        <div className="mt-12">
          <h2 className="mb-4 text-2xl font-semibold">Transactions</h2>
          <AccountTransactionsTable data={account.transactions} />
        </div>
      </PageContainer>
    </>
  );
}

export function ErrorBoundary() {
  return <ErrorComponent />;
}
