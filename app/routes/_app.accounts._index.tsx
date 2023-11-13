import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { Link } from "@remix-run/react";
import { IconPlus } from "@tabler/icons-react";
import { typedjson, useTypedLoaderData } from "remix-typedjson";

import { AccountsTable } from "~/components/accounts/accounts-table";
import { PageContainer } from "~/components/page-container";
import { PageHeader } from "~/components/page-header";
import { Button } from "~/components/ui/button";
import { prisma } from "~/utils/db.server";
import { requireUser } from "~/utils/session.server";

export const meta: MetaFunction = () => [{ title: "Users • Alliance 436" }];

export async function loader({ request }: LoaderFunctionArgs) {
  await requireUser(request, ["ACCOUNTANT", "ADMIN", "OWNER", "SUPERADMIN"]);
  const accounts = await prisma.account.findMany({
    include: { transactions: true },
    orderBy: { name: "desc" },
  });
  return typedjson({ accounts });
}

export default function AccountssIndexPage() {
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
        <AccountsTable accounts={accounts} />
      </PageContainer>
    </>
  );
}
