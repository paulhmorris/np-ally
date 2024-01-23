import { Engagement, UserRole } from "@prisma/client";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { Link, type MetaFunction } from "@remix-run/react";
import { withZod } from "@remix-validated-form/with-zod";
import { IconAddressBook, IconPlus, IconUser } from "@tabler/icons-react";
import dayjs from "dayjs";
import { useState } from "react";
import { typedjson, useTypedLoaderData } from "remix-typedjson";
import invariant from "tiny-invariant";
import { z } from "zod";

import { ContactCard } from "~/components/contacts/contact-card";
import { ContactEngagementsTable } from "~/components/contacts/contact-engagements-table";
import { RecentTransactionsTable } from "~/components/contacts/recent-donations-table";
import { ErrorComponent } from "~/components/error-component";
import { ConfirmDestructiveModal } from "~/components/modals/confirm-destructive-modal";
import { PageContainer } from "~/components/page-container";
import { PageHeader } from "~/components/page-header";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { prisma } from "~/integrations/prisma.server";
import { Sentry } from "~/integrations/sentry";
import { ContactType } from "~/lib/constants";
import { forbidden, notFound } from "~/lib/responses.server";
import { toast } from "~/lib/toast.server";
import { cn, useUser } from "~/lib/utils";
import { SessionService } from "~/services/SessionService.server";

const deleteAbleContactTypes = [ContactType.Donor, ContactType.External, ContactType.Organization];

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
        include: {
          type: true,
        },
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
        where: {
          date: { gte: dayjs().subtract(90, "d").toDate() },
        },
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

export async function action({ request, params }: ActionFunctionArgs) {
  await SessionService.requireAdmin(request);
  invariant(params.contactId, "contactId not found");

  const validator = withZod(z.object({ _action: z.enum(["delete"]) }));
  const result = await validator.validate(await request.formData());
  if (result.error) {
    return toast.json(
      request,
      { success: false },
      { variant: "destructive", title: "Error deleting contact", description: "Invalid request" },
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (result.data._action === "delete" && request.method === "DELETE") {
    const contact = await prisma.contact.findUnique({
      where: { id: params.contactId },
      include: {
        transactions: true,
      },
    });
    if (!contact) {
      return toast.json(
        request,
        { success: false },
        { variant: "destructive", title: "Error deleting contact", description: "Contact not found" },
        { status: 404 },
      );
    }
    if (!deleteAbleContactTypes.includes(contact.typeId)) {
      throw forbidden({ message: "You do not have permission to delete this contact." });
    }

    if (contact.transactions.length > 0) {
      return toast.json(
        request,
        { success: false },
        {
          variant: "destructive",
          title: "Error deleting contact",
          description: "This contact has transactions and cannot be deleted. Check the transactions page.",
        },
        { status: 400 },
      );
    }

    try {
      await prisma.$transaction([
        prisma.contactAssigment.deleteMany({ where: { contactId: contact.id } }),
        prisma.engagement.deleteMany({ where: { contactId: contact.id } }),
        prisma.address.deleteMany({ where: { contactId: contact.id } }),
        prisma.contact.delete({ where: { id: contact.id } }),
      ]);
      return toast.redirect(request, "/contacts", {
        title: "Contact deleted",
        description: `${contact.firstName} ${contact.lastName} was deleted successfully.`,
      });
    } catch (error) {
      Sentry.captureException(error);
      console.error(error);
      return toast.json(
        request,
        { success: false },
        {
          variant: "destructive",
          title: "Error deleting contact",
          description: "An error occurred while deleting the contact.",
        },
        { status: 500 },
      );
    }
  }
}

export const meta: MetaFunction<typeof loader> = ({ data }) => [
  {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    title: `${data.contact.firstName}${
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      data.contact.lastName ? " " + data.contact.lastName : ""
    } | Alliance 436`,
  },
];

export default function ContactDetailsPage() {
  const user = useUser();
  const { contact } = useTypedLoaderData<typeof loader>();
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const { Donor, External, Organization } = ContactType;
  const isExternal = [Donor, External, Organization].includes(contact.typeId);
  const canDelete =
    !contact.user &&
    contact.transactions.length === 0 &&
    user.role !== UserRole.USER &&
    deleteAbleContactTypes.includes(contact.typeId);

  return (
    <>
      <PageHeader title="View Contact">
        {canDelete ? (
          <ConfirmDestructiveModal
            open={deleteModalOpen}
            onOpenChange={setDeleteModalOpen}
            description={`This action cannot be undone. This will delete ${contact.firstName} ${
              contact.lastName ? contact.lastName : ""
            } and all associated engagements. Assigned users will be unassigned.`}
          />
        ) : null}
      </PageHeader>
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
          {isExternal ? (
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
        {isExternal && contact.engagements.length > 0 ? (
          <div className="mt-12">
            <h2 className="mb-4 text-2xl font-semibold">Engagements</h2>
            <ContactEngagementsTable data={contact.engagements} />
          </div>
        ) : null}
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
