import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { typedjson, useTypedLoaderData } from "remix-typedjson";

import { ErrorComponent } from "~/components/error-component";
import { PageContainer } from "~/components/page-container";
import { PageHeader } from "~/components/page-header";
import { prisma } from "~/integrations/prisma.server";
import { requireUser } from "~/lib/session.server";
import { AccountsTable } from "~/routes/_app.accounts._index/accounts-table";

export const meta: MetaFunction = () => [{ title: "Accounts • Alliance 436" }];

export async function loader({ request }: LoaderFunctionArgs) {
  await requireUser(request, ["ADMIN", "SUPERADMIN"]);
  const accounts = await prisma.account.findMany({
    include: { transactionItems: true, type: true },
    orderBy: { code: "desc" },
  });
  return typedjson({ accounts });
}

export default function AccountsIndexPage() {
  const { accounts } = useTypedLoaderData<typeof loader>();
  return (
    <>
      <PageHeader title="Accounts">
        {/* <Button asChild>
          <Link to="#">
            <IconPlus className="mr-2 h-5 w-5" />
            <span>New Account</span>
          </Link>
        </Button> */}
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
