import { Prisma } from "@prisma/client";
import { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { Link } from "@remix-run/react";
import { withZod } from "@remix-validated-form/with-zod";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { typedjson, useTypedLoaderData } from "remix-typedjson";
import { ValidatedForm, validationError } from "remix-validated-form";
import invariant from "tiny-invariant";
import { z } from "zod";
dayjs.extend(utc);

import { ErrorComponent } from "~/components/error-component";
import { PageContainer } from "~/components/page-container";
import { PageHeader } from "~/components/page-header";
import { BackButton } from "~/components/ui/back-button";
import { FormField } from "~/components/ui/form";
import { SubmitButton } from "~/components/ui/submit-button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table";
import { db } from "~/integrations/prisma.server";
import { Sentry } from "~/integrations/sentry";
import { getPrismaErrorText, notFound } from "~/lib/responses.server";
import { toast } from "~/lib/toast.server";
import { cn, formatCentsAsDollars } from "~/lib/utils";
import { SessionService } from "~/services.server/session";

const schema = withZod(
  z.object({
    id: z.string().cuid(),
    date: z.string(),
    description: z.string().optional(),
  }),
);

export const loader = async ({ params, request }: LoaderFunctionArgs) => {
  invariant(params.transactionId, "transactionId not found");
  await SessionService.requireAdmin(request);
  const orgId = await SessionService.requireOrgId(request);

  const transaction = await db.transaction.findUnique({
    where: { id: params.transactionId, orgId },
    include: {
      account: true,
      contact: true,
      transactionItems: {
        include: {
          type: true,
          method: true,
        },
      },
    },
  });

  if (!transaction) throw notFound({ message: "Transaction not found" });

  return typedjson({ transaction });
};

export const meta: MetaFunction = () => [{ title: "Transaction Edit" }];

export const action = async ({ request }: ActionFunctionArgs) => {
  await SessionService.requireAdmin(request);
  const orgId = await SessionService.requireOrgId(request);

  const result = await schema.validate(await request.formData());
  if (result.error) {
    return validationError(result.error);
  }

  const { date, description, id } = result.data;

  try {
    await db.transaction.update({
      where: { id, orgId },
      data: {
        date: new Date(date),
        description: description || undefined,
      },
    });

    return toast.redirect(request, `/transactions/${id}`, {
      type: "success",
      title: "Transaction updated",
      description: `Transaction has been updated.`,
    });
  } catch (error) {
    console.error(error);
    Sentry.captureException(error);
    let message = error instanceof Error ? error.message : "";
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      message = getPrismaErrorText(error);
    }
    return toast.json(
      request,
      { success: false },
      {
        type: "error",
        title: "Error saving transaction",
        description: message,
      },
    );
  }
};

export default function TransactionDetailsPage() {
  const { transaction } = useTypedLoaderData<typeof loader>();

  return (
    <>
      <PageHeader title="Transaction Edit" />
      <BackButton to={`transactions/${transaction.id}`} />

      <PageContainer className="max-w-3xl">
        <div className="space-y-8">
          <div>
            <h2 className="sr-only">Details</h2>
            <dl className="divide-y divide-muted">
              <DetailItem label="Id" value={transaction.id} />
              <DetailItem label="Account">
                <Link to={`/accounts/${transaction.accountId}`} className="font-medium text-primary">
                  {`${transaction.account.code}`} - {transaction.account.description}
                </Link>
              </DetailItem>
              <ValidatedForm
                id="transaction-edit"
                validator={schema}
                method="PUT"
                defaultValues={{
                  date: dayjs(transaction.date).utc().format("YYYY-MM-DD"),
                  description: transaction.description ?? "",
                }}
                className="flex flex-col"
              >
                <input type="hidden" name="id" value={transaction.id} />
                <div className="items-center py-1.5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                  <dt className="text-sm font-semibold capitalize">Date</dt>
                  <dd className={cn("mt-1 sm:col-span-2 sm:mt-0")}>
                    <FormField name="date" label="Date" hideLabel type="date" />
                  </dd>
                </div>
                <div className="items-center py-1.5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                  <dt className="text-sm font-semibold capitalize">Description</dt>
                  <dd className={cn("mt-1 sm:col-span-2 sm:mt-0")}>
                    <FormField name="description" label="Description" hideLabel type="text" />
                  </dd>
                </div>
                {transaction.contact ? (
                  <DetailItem label="Contact">
                    <Link
                      to={`/contacts/${transaction.contactId}`}
                      className="font-medium text-primary"
                    >{`${transaction.contact.firstName} ${transaction.contact.lastName}`}</Link>
                  </DetailItem>
                ) : null}
                <SubmitButton className="ml-auto">Save</SubmitButton>
              </ValidatedForm>
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
