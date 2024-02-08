import { UserRole } from "@prisma/client";
import { type LoaderFunctionArgs, type MetaFunction } from "@remix-run/node";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { typedjson, useTypedLoaderData } from "remix-typedjson";
dayjs.extend(utc);

import { AnnouncementCard } from "~/components/admin/announcement-card";
import { ReimbursementRequestsList } from "~/components/admin/reimbursement-requests-list";
import { ErrorComponent } from "~/components/error-component";
import { PageContainer } from "~/components/page-container";
import { PageHeader } from "~/components/page-header";
import { AccountBalanceCard } from "~/components/users/balance-card";
import { prisma } from "~/integrations/prisma.server";
import { useUser } from "~/lib/utils";
import { SessionService } from "~/services/SessionService.server";

export const meta: MetaFunction = () => [{ title: "Home | Alliance 436" }];

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await SessionService.requireUser(request);

  const [total, reimbursementRequests, announcement] = await Promise.all([
    prisma.transaction.aggregate({
      where: {
        account: {
          user: { id: user.id },
        },
      },
      _sum: { amountInCents: true },
    }),
    // prisma.contact.findMany({
    //   where: {
    //     assignedUsers: {
    //       some: {
    //         userId: user.id,
    //       },
    //     },
    //     engagements: {
    //       some: {},
    //       every: {
    //         date: {
    //           lte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    //         },
    //       },
    //     },
    //   },
    // }),
    prisma.reimbursementRequest.findMany({
      where: {
        userId: user.id,
        status: "PENDING",
      },
      include: {
        account: true,
        user: {
          include: { contact: true },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    }),
    prisma.announcement.findFirst({
      where: {
        OR: [
          {
            expiresAt: { gt: dayjs().utc().toDate() },
          },
          { expiresAt: null },
        ],
      },
      orderBy: {
        id: "desc",
      },
    }),
  ]);

  return typedjson({ total: total._sum.amountInCents, reimbursementRequests, announcement });
}

export default function Index() {
  const user = useUser();
  const { total, reimbursementRequests, announcement } = useTypedLoaderData<typeof loader>();

  return (
    <>
      <PageHeader title="Home" />
      <PageContainer className="max-w-4xl">
        <div className="mb-4">{announcement ? <AnnouncementCard announcement={announcement} /> : null}</div>
        {user.role === UserRole.USER ? (
          <div className="space-y-5">
            <div className="max-w-[320px]">
              <AccountBalanceCard totalCents={total} accountId={user.accountId} />
            </div>
            {reimbursementRequests.length > 0 ? (
              <div className="max-w-2xl">
                <ReimbursementRequestsList requests={reimbursementRequests} />
              </div>
            ) : null}
          </div>
        ) : null}
      </PageContainer>
    </>
  );
}

export function ErrorBoundary() {
  return <ErrorComponent />;
}
