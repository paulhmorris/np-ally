import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { Form, Link, useSearchParams, useSubmit } from "@remix-run/react";
import { IconPlus } from "@tabler/icons-react";
import { typedjson, useTypedLoaderData } from "remix-typedjson";

import { ContactsTable } from "~/components/contacts/contacts-table";
import { ErrorComponent } from "~/components/error-component";
import { PageContainer } from "~/components/page-container";
import { PageHeader } from "~/components/page-header";
import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import { Label } from "~/components/ui/label";
import { prisma } from "~/integrations/prisma.server";
import { SessionService } from "~/services/SessionService.server";

export const meta: MetaFunction = () => [{ title: "Contacts | Alliance 436" }];

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await SessionService.requireUser(request);
  const orgId = await SessionService.requireOrgId(request);

  const onlyMine = new URL(request.url).searchParams.get("mine") === "true";

  // Only show a user's assigned contacts
  if (onlyMine) {
    const contacts = await prisma.contact.findMany({
      where: {
        orgId,
        OR: [
          {
            assignedUsers: {
              some: {
                userId: user.id,
              },
            },
          },
          {
            user: {
              id: user.id,
            },
          },
        ],
      },
      include: { type: true },
    });
    return typedjson({ contacts });
  }

  const contacts = await prisma.contact.findMany({
    where: { orgId },
    include: { type: true },
    orderBy: { createdAt: "desc" },
  });
  return typedjson({ contacts });
}

export default function ContactIndexPage() {
  const { contacts } = useTypedLoaderData<typeof loader>();
  const submit = useSubmit();
  const [searchParams] = useSearchParams();

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
        <Form className="mb-4 flex items-center gap-2" onChange={(e) => submit(e.currentTarget)}>
          <Label className="inline-flex cursor-pointer items-center gap-2">
            <Checkbox
              name="mine"
              value="true"
              aria-label="Only my contacts"
              defaultChecked={searchParams.get("mine") === "true"}
            />
            <span>Only my contacts</span>
          </Label>
        </Form>
        <ContactsTable data={contacts} />
      </PageContainer>
    </>
  );
}

export function ErrorBoundary() {
  return <ErrorComponent />;
}
