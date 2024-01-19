import { UserRole } from "@prisma/client";
import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { Link } from "@remix-run/react";
import { IconPlus } from "@tabler/icons-react";
import { typedjson, useTypedLoaderData } from "remix-typedjson";

import { ContactsTable } from "~/components/contacts/contacts-table";
import { ErrorComponent } from "~/components/error-component";
import { PageContainer } from "~/components/page-container";
import { PageHeader } from "~/components/page-header";
import { Button } from "~/components/ui/button";
import { prisma } from "~/integrations/prisma.server";
import { SessionService } from "~/services/SessionService.server";

export const meta: MetaFunction = () => [{ title: "Contacts | Alliance 436" }];

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await SessionService.requireUser(request);

  // Only show a user's assigned contacts
  if (user.role === UserRole.USER) {
    const contacts = await prisma.contact.findMany({
      where: {
        assignedUsers: {
          some: {
            userId: user.id,
          },
        },
      },
      include: { type: true },
    });
    return typedjson({ contacts });
  }

  const contacts = await prisma.contact.findMany({
    include: { type: true },
    orderBy: { createdAt: "desc" },
  });
  return typedjson({ contacts });
}

export default function ContactIndexPage() {
  const { contacts } = useTypedLoaderData<typeof loader>();

  return (
    <>
      <PageHeader title="Contacts">
        <Button asChild>
          <Link to="/contacts/new">
            <IconPlus className="mr-2 h-5 w-5" />
            <span>New Contact</span>
          </Link>
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
