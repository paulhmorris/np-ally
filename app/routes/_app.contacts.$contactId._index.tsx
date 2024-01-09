import { Engagement } from "@prisma/client";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { Link, type MetaFunction } from "@remix-run/react";
import { IconAddressBook, IconPlus, IconUser } from "@tabler/icons-react";
import dayjs from "dayjs";
import { typedjson, useTypedLoaderData } from "remix-typedjson";
import invariant from "tiny-invariant";

import { ContactCard } from "~/components/contacts/contact-card";
import { RecentTransactionsTable } from "~/components/contacts/recent-donations-table";
import { ErrorComponent } from "~/components/error-component";
import { PageContainer } from "~/components/page-container";
import { PageHeader } from "~/components/page-header";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { prisma } from "~/integrations/prisma.server";
import { ContactType } from "~/lib/constants";
import { notFound } from "~/lib/responses.server";
import { cn } from "~/lib/utils";
import { SessionService } from "~/services/SessionService.server";

export const meta: MetaFunction = () => [{ title: "Contact • Alliance 436" }];

export const loader = async ({ params, request }: LoaderFunctionArgs) => {
  await SessionService.requireUser(request);
  invariant(params.contactId, "contactId not found");

  const contact = await prisma.contact.findUnique({
    where: { id: params.contactId },
    include: {
      user: true,
      type: true,
      address: true,
      engagements: {
        orderBy: { date: "desc" },
      },
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
  const { Donor, External, Organization } = ContactType;

  return (
    <>
      <PageHeader title="View Contact" />
      <div className="mt-4 flex flex-wrap items-center gap-2 sm:mt-1">
        <Badge variant="outline" className="capitalize">
          <div>
            <IconAddressBook className="size-3" />
          </div>
          <span>{contact.type.name.toLowerCase()}</span>
        </Badge>
        {contact.user ? (
          <Badge variant="secondary">
            <Link to={`/users/${contact.user.id}`} className="flex items-center gap-1.5">
              <div>
                <IconUser className="size-3" />
              </div>
              <span>{contact.user.username}</span>
            </Link>
          </Badge>
        ) : null}
      </div>
      <PageContainer className="max-w-screen-md">
        <div className="space-y-5">
          {[Donor, External, Organization].includes(contact.typeId) ? (
            <div className="space-y-2">
              <DaysSinceLastEngagement engagements={contact.engagements} />
              <Button asChild variant="outline">
                <Link
                  to={{
                    pathname: "/engagements/new",
                    search: `?contactId=${contact.id}`,
                  }}
                >
                  <IconPlus className="mr-2 h-5 w-5" />
                  <span>New Engagement</span>
                </Link>
              </Button>
            </div>
          ) : null}
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
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
          {contact.transactions.length > 0 ? <RecentTransactionsTable transactions={contact.transactions} /> : null}
        </div>
      </PageContainer>
    </>
  );
}

function DaysSinceLastEngagement({ engagements }: { engagements: Array<Engagement> }) {
  if (engagements.length === 0) return null;
  const daysSinceLastEngagement = dayjs().diff(dayjs(engagements[0].date), "d");

  return (
    <p className="text-sm">
      <span className={cn("font-bold", daysSinceLastEngagement > 30 ? "text-destructive" : "text-success")}>
        {daysSinceLastEngagement} day{daysSinceLastEngagement === 1 ? "" : "s"}{" "}
      </span>
      since last engagement.
    </p>
  );
}

export function ErrorBoundary() {
  return <ErrorComponent />;
}
