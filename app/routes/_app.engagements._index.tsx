import { UserRole } from "@prisma/client";
import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { Link } from "@remix-run/react";
import { IconPlus } from "@tabler/icons-react";
import { typedjson, useTypedLoaderData } from "remix-typedjson";

import { EngagementsTable } from "~/components/contacts/engagements-table";
import { ErrorComponent } from "~/components/error-component";
import { PageContainer } from "~/components/page-container";
import { PageHeader } from "~/components/page-header";
import { Button } from "~/components/ui/button";
import { prisma } from "~/integrations/prisma.server";
import { SessionService } from "~/services/SessionService.server";

export const meta: MetaFunction = () => [{ title: "Engagements | Alliance 436" }];

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await SessionService.requireUser(request);

  const engagements = await prisma.engagement.findMany({
    where:
      user.role === UserRole.USER
        ? {
            userId: user.id,
          }
        : undefined,
    include: { type: true, contact: true },
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
