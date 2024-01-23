import { Prisma, UserRole } from "@prisma/client";
import { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { Link } from "@remix-run/react";
import { withZod } from "@remix-validated-form/with-zod";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { useState } from "react";
import { typedjson, useTypedLoaderData } from "remix-typedjson";
import { setFormDefaults, validationError } from "remix-validated-form";
import invariant from "tiny-invariant";
import { z } from "zod";
dayjs.extend(utc);

import { ErrorComponent } from "~/components/error-component";
import { ConfirmDestructiveModal } from "~/components/modals/confirm-destructive-modal";
import { PageContainer } from "~/components/page-container";
import { PageHeader } from "~/components/page-header";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table";
import { prisma } from "~/integrations/prisma.server";
import { forbidden, notFound } from "~/lib/responses.server";
import { toast } from "~/lib/toast.server";
import { cn, formatCentsAsDollars, useUser } from "~/lib/utils";
import { SessionService } from "~/services/SessionService.server";

const validator = withZod(
  z.object({
    _action: z.literal("delete"),
  }),
);

export const loader = async ({ params, request }: LoaderFunctionArgs) => {
  invariant(params.transactionId, "transactionId not found");
  const user = await SessionService.requireUser(request);

  const transaction = await prisma.transaction.findUnique({
    where: { id: params.transactionId },
    include: {
      account: {
        include: {
          user: true,
        },
      },
      contact: true,
      transactionItems: {
        include: {
          type: true,
          method: true,
        },
      },
    },
  });
  if (user.role === UserRole.USER && transaction?.account.user?.id !== user.id) {
    throw forbidden({ message: "You do not have permission to view this transaction" });
  }
  if (!transaction) throw notFound({ message: "Transaction not found" });

  return typedjson({
    transaction,
    ...setFormDefaults("transactionForm", { ...transaction }),
  });
};

export const meta: MetaFunction = () => [{ title: "Transaction Details | Alliance 436" }];

export const action = async ({ params, request }: ActionFunctionArgs) => {
  await SessionService.requireAdmin(request);
  const result = await validator.validate(await request.formData());
  if (result.error) {
    return validationError(result.error);
  }

  const { transactionId } = params;

  const trx = await prisma.transaction.delete({ where: { id: transactionId }, include: { account: true } });
  return toast.redirect(request, "/transactions", {
    title: "Transaction deleted",
    description: `The transaction of ${formatCentsAsDollars(trx.amountInCents, 2)} on account ${
      trx.account.code
    } has been deleted.`,
  });
};

export default function TransactionDetailsPage() {
  const authorizedUser = useUser();
  const { transaction } = useTypedLoaderData<typeof loader>();
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <PageHeader title="Transaction Details" description={transaction.id}>
        <div className="flex items-center gap-2">
          {["SUPERADMIN", "ADMIN"].includes(authorizedUser.role) ? (
            <ConfirmDestructiveModal
              open={modalOpen}
              onOpenChange={setModalOpen}
              description={`This action cannot be undone. This will permanently delete the
                  transaction and its items, and change the balance of account ${transaction.account.code}.`}
            />
          ) : null}
        </div>
      </PageHeader>

      <PageContainer className="max-w-3xl">
        <div className="space-y-8">
          <div>
            <h2 className="sr-only">Details</h2>
            <dl className="divide-y divide-muted">
              <DetailItem label="Account">
                <Link to={`/accounts/${transaction.accountId}`} className="font-medium text-primary">
                  {`${transaction.account.code}`} - {transaction.account.description}
                </Link>
              </DetailItem>
              <DetailItem label="Date" value={dayjs(transaction.date).utc().format("MM/DD/YYYY")} />
              {transaction.contact ? (
                <DetailItem label="Contact">
                  <Link
                    to={`/contacts/${transaction.contactId}`}
                    className="font-medium text-primary"
                  >{`${transaction.contact.firstName} ${transaction.contact.lastName}`}</Link>
                </DetailItem>
              ) : null}
              {transaction.description ? <DetailItem label="Description" value={transaction.description} /> : null}
            </dl>
          </div>

          <div>
            <h2 className="sr-only">Items</h2>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transaction.transactionItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.type.name}</TableCell>
                    <TableCell>{item.method?.name}</TableCell>
                    <TableCell>{item.description}</TableCell>
                    <TableCell className="text-right">{formatCentsAsDollars(item.amountInCents, 2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="flex items-center justify-end gap-2 border-t pr-4 pt-4 text-sm font-bold">
              <p>Total</p>
              <p>{formatCentsAsDollars(transaction.amountInCents, 2)}</p>
            </div>
          </div>
        </div>
      </PageContainer>
    </>
  );
}

function DetailItem({
  label,
  value,
  children,
}: {
  label: string;
  value?: Prisma.JsonValue;
  children?: React.ReactNode;
}) {
  return (
    <div className="items-center py-1.5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
      <dt className="text-sm font-semibold capitalize">{label}</dt>
      <dd className={cn("mt-1 text-sm text-muted-foreground sm:col-span-2 sm:mt-0")}>
        {value ? String(value) : undefined}
        {children}
      </dd>
    </div>
  );
}

export function ErrorBoundary() {
  return <ErrorComponent />;
}
