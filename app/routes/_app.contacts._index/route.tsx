import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { Link } from "@remix-run/react";
import { typedjson, useTypedLoaderData } from "remix-typedjson";

import { ErrorComponent } from "~/components/error-component";
import { PageContainer } from "~/components/page-container";
import { PageHeader } from "~/components/page-header";
import { Button } from "~/components/ui/button";
import { prisma } from "~/integrations/prisma.server";
import { requireUser } from "~/lib/session.server";
import { ContactsTable } from "~/routes/_app.contacts._index/contacts-table";

export const meta: MetaFunction = () => [{ title: "Contacts • Alliance 436" }];

export async function loader({ request }: LoaderFunctionArgs) {
  await requireUser(request, ["SUPERADMIN"]);
  const contacts = await prisma.contact.findMany({
    include: { type: true },
    orderBy: { createdAt: "desc" },
  });
  return typedjson({ contacts });
}

export default function UserIndexPage() {
  const { contacts } = useTypedLoaderData<typeof loader>();
  return (
    <>
      <PageHeader title="Contacts">
        <Button asChild>
          <Link to="/contacts/new">New Contact</Link>
        </Button>
      </PageHeader>

      <PageContainer>
        <ContactsTable data={contacts} />
      </PageContainer>
    </>
  );
}

export function ErrorBoundary() {
  return <ErrorComponent />;
}
