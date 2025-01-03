import { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { Link } from "@remix-run/react";
import { withZod } from "@remix-validated-form/with-zod";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { typedjson, useTypedLoaderData } from "remix-typedjson";
import invariant from "tiny-invariant";
import { z } from "zod";
dayjs.extend(utc);

import { PageHeader } from "~/components/common/page-header";
import { ConfirmDestructiveModal } from "~/components/modals/confirm-destructive-modal";
import { PageContainer } from "~/components/page-container";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "~/components/ui/card";
import { db } from "~/integrations/prisma.server";
import { notFound } from "~/lib/responses.server";
import { Toasts } from "~/lib/toast.server";
import { SessionService } from "~/services.server/session";

export const meta: MetaFunction = () => [{ title: "View Engagement" }];

export const loader = async ({ params, request }: LoaderFunctionArgs) => {
  await SessionService.requireUser(request);
  const orgId = await SessionService.requireOrgId(request);

  invariant(params.engagementId, "engagementId not found");

  const engagement = await db.engagement.findUnique({
    where: { id: Number(params.engagementId), orgId },
    include: {
      contact: true,
      type: true,
    },
  });

  if (!engagement) {
    throw notFound("Engagement not found");
  }

  return typedjson({ engagement });
};

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const user = await SessionService.requireUser(request);
  const orgId = await SessionService.requireOrgId(request);

  invariant(params.engagementId, "engagementId not found");

  const validator = withZod(z.object({ _action: z.literal("delete") }));
  const result = await validator.validate(await request.formData());
  if (result.error) {
    return Toasts.jsonWithError(
      { success: false },
      { title: "Error deleting engagement", description: "Invalid request" },
    );
  }

  try {
    const engagement = await db.engagement.findUniqueOrThrow({
      where: { id: Number(params.engagementId), orgId },
      select: { userId: true },
    });

    // Users can only delete their own engagements
    if (user.isMember) {
      if (engagement.userId !== user.id) {
        return Toasts.jsonWithError(
          { success: false },
          { title: "Error deleting engagement", description: "You do not have permission to delete this engagement." },
        );
      }
    }

    await db.engagement.delete({ where: { id: Number(params.engagementId), orgId } });
    return Toasts.redirectWithSuccess("/engagements", {
      title: "Engagement deleted",
      description: "The engagement has been deleted",
    });
  } catch (error) {
    return Toasts.jsonWithError(
      { success: false },
      { title: "Error deleting engagement", description: "An error occurred" },
    );
  }
};

export default function EngagementPage() {
  const { engagement } = useTypedLoaderData<typeof loader>();

  return (
    <>
      <PageHeader title="View Engagement" />
      <PageContainer className="max-w-md">
        <Card>
          <CardHeader>
            <CardTitle>
              <Link to={`/contacts/${engagement.contactId}`} className="text-primary">
                {engagement.contact.firstName} {engagement.contact.lastName}
              </Link>
            </CardTitle>
            <CardDescription>
              via {engagement.type.name} on {dayjs(engagement.date).utc().format("MM/DD/YYYY")}
            </CardDescription>
          </CardHeader>
          <CardContent>{engagement.description}</CardContent>
          <CardFooter>
            <ConfirmDestructiveModal
              description={`This action cannot be undone. This engagement with ${engagement.contact.firstName}${
                engagement.contact.lastName ? " " + engagement.contact.lastName : ""
              } will be permanently deleted. If there are no other engagements with this contact, users will no longer receive notifications to follow up.`}
            />
            <Button asChild variant="outline" className="ml-auto">
              <Link to={`/engagements/${engagement.id}/edit`}>Edit</Link>
            </Button>
          </CardFooter>
        </Card>
      </PageContainer>
    </>
  );
}
