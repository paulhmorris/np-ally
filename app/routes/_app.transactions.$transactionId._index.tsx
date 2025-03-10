import { Prisma } from "@prisma/client";
import { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { Link } from "@remix-run/react";
import { withZod } from "@remix-validated-form/with-zod";
import { IconExternalLink } from "@tabler/icons-react";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { typedjson, useTypedLoaderData } from "remix-typedjson";
import { validationError } from "remix-validated-form";
import invariant from "tiny-invariant";
import { z } from "zod";
dayjs.extend(utc);

import { PageHeader } from "~/components/common/page-header";
import { ErrorComponent } from "~/components/error-component";
import { ConfirmDestructiveModal } from "~/components/modals/confirm-destructive-modal";
import { PageContainer } from "~/components/page-container";
import { Button } from "~/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table";
import { useUser } from "~/hooks/useUser";
import { db } from "~/integrations/prisma.server";
import { Sentry } from "~/integrations/sentry";
import { forbidden } from "~/lib/responses.server";
import { Toasts } from "~/lib/toast.server";
import { cn, formatCentsAsDollars } from "~/lib/utils";
import { generateS3Urls } from "~/services.server/receipt";
import { SessionService } from "~/services.server/session";

const validator = withZod(z.object({ _action: z.literal("delete") }));

export const loader = async ({ params, request }: LoaderFunctionArgs) => {
  invariant(params.transactionId, "transactionId not found");
  const user = await SessionService.requireUser(request);
  const orgId = await SessionService.requireOrgId(request);

  try {
    const trx = await db.transaction.findUniqueOrThrow({
      where: { id: params.transactionId, orgId },
      select: {
        id: true,
        date: true,
        description: true,
        amountInCents: true,
        contactId: true,
        category: {
          select: {
            id: true,
            name: true,
          },
        },
        account: {
          select: {
            id: true,
            code: true,
            description: true,
            user: {
              select: {
                id: true,
              },
            },
          },
        },
        receipts: {
          select: {
            id: true,
            s3Key: true,
            s3Url: true,
            s3UrlExpiry: true,
            title: true,
          },
        },
        contact: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        transactionItems: {
          select: {
            id: true,
            description: true,
            amountInCents: true,
            type: {
              select: {
                name: true,
              },
            },
            method: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    if (user.isMember && trx.account.user?.id !== user.id) {
      throw forbidden({ message: "You do not have permission to view this transaction" });
    }

    trx.receipts = await generateS3Urls(trx.receipts);
    return typedjson({ transaction: trx });
  } catch (error) {
    console.error(error);
    Sentry.captureException(error);
    throw error;
  }
};

export const meta: MetaFunction = () => [{ title: "Transaction Details" }];

export const action = async ({ params, request }: ActionFunctionArgs) => {
  await SessionService.requireAdmin(request);
  const orgId = await SessionService.requireOrgId(request);

  const result = await validator.validate(await request.formData());
  if (result.error) {
    return validationError(result.error);
  }

  const { transactionId } = params;

  const trx = await db.transaction.delete({ where: { id: transactionId, orgId }, include: { account: true } });
  return Toasts.redirectWithSuccess("/transactions", {
    title: "Transaction deleted",
    description: `The transaction of ${formatCentsAsDollars(trx.amountInCents, 2)} on account ${
      trx.account.code
    } has been deleted.`,
  });
};

export default function TransactionDetailsPage() {
  const authorizedUser = useUser();
  const { transaction } = useTypedLoaderData<typeof loader>();

  return (
    <>
      <PageHeader title="Transaction Details">
        <div className="flex items-center gap-2">
          {!authorizedUser.isMember ? (
            <Button variant="outline" asChild>
              <Link to={`/transactions/${transaction.id}/edit`}>Edit</Link>
            </Button>
          ) : null}
          {["SUPERADMIN", "ADMIN"].includes(authorizedUser.role) ? (
            <ConfirmDestructiveModal
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
              <DetailItem label="Id" value={transaction.id} />
              <DetailItem label="Account">
                <Link to={`/accounts/${transaction.account.id}`} className="font-medium text-primary">
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
              <DetailItem label="Category" value={transaction.category?.name} />
              {transaction.description ? <DetailItem label="Note" value={transaction.description} /> : null}
              {transaction.receipts.length > 0 ? (
                <div className="items-center py-1.5 text-sm sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                  <dt className="self-start font-semibold capitalize">Receipts</dt>
                  <dd className="col-span-2 text-muted-foreground">
                    {transaction.receipts.length > 0 ? (
                      transaction.receipts.map((receipt) => {
                        if (!receipt.s3Url) {
                          return (
                            <span key={receipt.id} className="text-muted-foregrounded-none block">
                              {receipt.title} (Link missing or broken - try refreshing)
                            </span>
                          );
                        }

                        return (
                          <a
                            key={receipt.id}
                            href={receipt.s3Url}
                            className="flex items-center gap-1.5 font-medium text-primary"
                            target="_blank"
                            rel="noreferrer"
                          >
                            <span>{receipt.title}</span>
                            <IconExternalLink className="size-3.5" aria-hidden="true" />
                          </a>
                        );
                      })
                    ) : (
                      <span className="text-muted-foreground">None</span>
                    )}
                  </dd>
                </div>
              ) : null}
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
                    <TableCell>
                      {item.description?.includes("Reimbursement ID:") && !authorizedUser.isMember ? (
                        <Link
                          to={`/reimbursements/${item.description.split(": ")[1]}`}
                          className="font-medium text-primary"
                        >
                          Reimbursement
                        </Link>
                      ) : (
                        item.description
                      )}
                    </TableCell>
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
