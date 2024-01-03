import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { Link } from "@remix-run/react";
import { typedjson, useTypedLoaderData } from "remix-typedjson";

import { ErrorComponent } from "~/components/error-component";
import { PageContainer } from "~/components/page-container";
import { PageHeader } from "~/components/page-header";
import { Button } from "~/components/ui/button";
import { UsersTable } from "~/components/users/users-table";
import { prisma } from "~/integrations/prisma.server";
import { requireUser } from "~/lib/session.server";

export const meta: MetaFunction = () => [{ title: "Users • Alliance 436" }];

export async function loader({ request }: LoaderFunctionArgs) {
  await requireUser(request, ["ADMIN"]);
  const users = await prisma.user.findMany({
    include: { contact: true },
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

export function ErrorBoundary() {
  return <ErrorComponent />;
}
