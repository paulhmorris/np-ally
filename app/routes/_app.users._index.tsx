import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { Link } from "@remix-run/react";
import { typedjson, useTypedLoaderData } from "remix-typedjson";

import { PageContainer } from "~/components/page-container";
import { PageHeader } from "~/components/page-header";
import { Button } from "~/components/ui/button";
import { UsersTable } from "~/components/users/users-table";
import { prisma } from "~/utils/db.server";
import { requireUser } from "~/utils/session.server";

export const meta: MetaFunction = () => [{ title: "Users • Alliance 436" }];

export async function loader({ request }: LoaderFunctionArgs) {
  await requireUser(request, ["SUPERADMIN"]);
  const users = await prisma.user.findMany({
    include: { account: true },
    orderBy: { createdAt: "desc" },
  });
  return typedjson({ users });
}

export default function UserIndexPage() {
  const { users } = useTypedLoaderData<typeof loader>();
  return (
    <>
      <PageHeader title="Users">
        <Button asChild>
          <Link to="/users/new">New User</Link>
        </Button>
      </PageHeader>

      <PageContainer>
        <UsersTable users={users} />
      </PageContainer>
    </>
  );
}
