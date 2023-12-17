import type { LoaderFunctionArgs } from "@remix-run/node";
import { type MetaFunction } from "@remix-run/react";
import { typedjson, useTypedLoaderData } from "remix-typedjson";
import invariant from "tiny-invariant";

import { ContactCard } from "~/components/contacts/contact-card";
import { RecentDonationsTable } from "~/components/contacts/recent-donations-table";
import { ErrorComponent } from "~/components/error-component";
import { PageContainer } from "~/components/page-container";
import { PageHeader } from "~/components/page-header";
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
          <div className="max-w-xs">
            <ContactCard contact={contact} />
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
