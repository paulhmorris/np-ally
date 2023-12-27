import type { LoaderFunctionArgs } from "@remix-run/node";
import { Link, type MetaFunction } from "@remix-run/react";
import { typedjson, useTypedLoaderData } from "remix-typedjson";
import invariant from "tiny-invariant";

import { ContactCard } from "~/components/contacts/contact-card";
import { RecentDonationsTable } from "~/components/contacts/recent-donations-table";
import { ErrorComponent } from "~/components/error-component";
import { PageContainer } from "~/components/page-container";
import { PageHeader } from "~/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { prisma } from "~/integrations/prisma.server";
import { ContactType } from "~/lib/constants";
import { notFound } from "~/lib/responses.server";
import { requireUser } from "~/lib/session.server";

export const meta: MetaFunction = () => [{ title: "Contact • Alliance 436" }];

export const loader = async ({ params, request }: LoaderFunctionArgs) => {
  await requireUser(request);
  invariant(params.contactId, "contactId not found");

  const contact = await prisma.contact.findUnique({
    where: { id: params.contactId },
    include: {
      user: true,
      type: true,
      address: true,
      assignedUsers: {
        include: {
          user: {
            include: {
              contact: true,
            },
          },
        },
      },
      transactions: {
        include: {
          account: true,
        },
        orderBy: { date: "desc" },
      },
    },
  });
  if (!contact) throw notFound({ message: "Contact not found" });

  return typedjson({ contact });
};

export default function ContactDetailsPage() {
  const { contact } = useTypedLoaderData<typeof loader>();

  return (
    <>
      <PageHeader title="View Contact" description={contact.id} />
      <PageContainer>
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-5">
            <ContactCard contact={contact} />
            {contact.assignedUsers.length > 0 ? (
              <Card className="flex-1 basis-48 bg-transparent">
                <CardHeader>
                  <CardTitle>Assigned Users</CardTitle>
                  <CardDescription>These users receive regular reminders to engage with this Contact.</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul>
                    {contact.assignedUsers.map((a) => (
                      <li key={a.id}>
                        <Link to={`/users/${a.userId}`} className="text-sm font-medium text-primary">
                          {a.user.contact.firstName} {a.user.contact.lastName}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ) : null}
          </div>
          <div>
            {/* eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison */}
            {contact.typeId === ContactType.Donor ? <RecentDonationsTable transactions={contact.transactions} /> : null}
          </div>
        </div>
      </PageContainer>
    </>
  );
}

export function ErrorBoundary() {
  return <ErrorComponent />;
}
