import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { Link } from "@remix-run/react";
import { IconPlus } from "@tabler/icons-react";
import { typedjson, useTypedLoaderData } from "remix-typedjson";

import { AccountsTable } from "~/components/accounts/accounts-table";
import { ErrorComponent } from "~/components/error-component";
import { PageContainer } from "~/components/page-container";
import { PageHeader } from "~/components/page-header";
import { Button } from "~/components/ui/button";
import { prisma } from "~/integrations/prisma.server";
import { requireUser } from "~/lib/session.server";

export const meta: MetaFunction = () => [{ title: "Accounts • Alliance 436" }];

export async function loader({ request }: LoaderFunctionArgs) {
  await requireUser(request, ["ADMIN", "SUPERADMIN"]);
  const accounts = await prisma.account.findMany({
    include: { transactions: true, type: true },
    orderBy: { code: "desc" },
  });
  return typedjson({ accounts });
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
