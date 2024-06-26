import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { Link } from "@remix-run/react";
import { IconPlus } from "@tabler/icons-react";
import { typedjson, useTypedLoaderData } from "remix-typedjson";

import { PageHeader } from "~/components/common/page-header";
import { EngagementsTable } from "~/components/contacts/engagements-table";
import { ErrorComponent } from "~/components/error-component";
import { PageContainer } from "~/components/page-container";
import { Button } from "~/components/ui/button";
import { db } from "~/integrations/prisma.server";
import { SessionService } from "~/services.server/session";

export const meta: MetaFunction = () => [{ title: "Engagements" }];

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await SessionService.requireUser(request);
  const orgId = await SessionService.requireOrgId(request);

  const engagements = await db.engagement.findMany({
    where: {
      orgId,
      userId: user.isMember ? user.id : undefined,
    },
    select: {
      id: true,
      date: true,
      type: {
        select: { name: true },
      },
      contact: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
      user: {
        select: {
          contact: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
      },
    },
    orderBy: { date: "desc" },
  });
  return typedjson({ engagements });
}

export default function EngagementIndexPage() {
  const { engagements } = useTypedLoaderData<typeof loader>();

  return (
    <>
      <PageHeader title="Engagements">
        <Button asChild>
          <Link to="/engagements/new">
            <IconPlus className="mr-2 h-5 w-5" />
            <span>New Engagement</span>
          </Link>
        </Button>
      </PageHeader>

      <PageContainer>
        <EngagementsTable data={engagements} />
      </PageContainer>
    </>
  );
}

export function ErrorBoundary() {
  return <ErrorComponent />;
}
