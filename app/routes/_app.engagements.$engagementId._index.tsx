import { LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { Link } from "@remix-run/react";
import dayjs from "dayjs";
import { typedjson, useTypedLoaderData } from "remix-typedjson";
import invariant from "tiny-invariant";

import { PageContainer } from "~/components/page-container";
import { PageHeader } from "~/components/page-header";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "~/components/ui/card";
import { prisma } from "~/integrations/prisma.server";
import { notFound } from "~/lib/responses.server";
import { requireUser } from "~/lib/session.server";

export const meta: MetaFunction = () => [{ title: "View Engagement • Alliance 436" }];

export const loader = async ({ params, request }: LoaderFunctionArgs) => {
  await requireUser(request);
  invariant(params.engagementId, "engagementId not found");

  const engagement = await prisma.engagement.findUnique({
    where: { id: Number(params.engagementId) },
    include: {
      contact: true,
      type: true,
    },
  });

  if (!engagement) {
    throw notFound("Engagement not found");
  }

  return typedjson({
    engagement,
  });
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
              {engagement.type.name} on {dayjs(engagement.date).format("MM/DD/YYYY")}
            </CardDescription>
          </CardHeader>
          <CardContent>{engagement.description}</CardContent>
          <CardFooter>
            <Button asChild variant="secondary" className="ml-auto">
              <Link to={`/engagements/${engagement.id}/edit`}>Edit</Link>
            </Button>
          </CardFooter>
        </Card>
      </PageContainer>
    </>
  );
}
