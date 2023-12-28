import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import type { MetaFunction } from "@remix-run/react";
import { withZod } from "@remix-validated-form/with-zod";
import { typedjson, useTypedLoaderData } from "remix-typedjson";
import { ValidatedForm, validationError } from "remix-validated-form";
import { z } from "zod";

import { ErrorComponent } from "~/components/error-component";
import { PageContainer } from "~/components/page-container";
import { PageHeader } from "~/components/page-header";
import { FormField, FormSelect } from "~/components/ui/form";
import { SubmitButton } from "~/components/ui/submit-button";
import { prisma } from "~/integrations/prisma.server";
import { TransactionItemType } from "~/lib/constants";
import { requireUser } from "~/lib/session.server";
import { toast } from "~/lib/toast.server";
import { getToday } from "~/lib/utils";
import { TransactionItemSchema } from "~/models/schemas";

const validator = withZod(
  z
    .object({
      date: z.coerce.date(),
      description: z.string().optional(),
      fromAccountId: z.string().cuid({ message: "From Account required" }),
      toAccountId: z.string().cuid({ message: "To Account required" }),
    })
    .merge(TransactionItemSchema.pick({ amountInCents: true })),
);

export const meta: MetaFunction = () => [{ title: "New Transfer • Alliance 436" }];

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await requireUser(request, ["SUPERADMIN", "ADMIN"]);
  const [accounts, transactionItemMethods] = await Promise.all([
    prisma.account.findMany(),
    prisma.transactionItemMethod.findMany(),
  ]);

  return typedjson({
    accounts,
    transactionItemMethods,
  });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  await requireUser(request, ["ADMIN", "SUPERADMIN"]);
  const result = await validator.validate(await request.formData());
  if (result.error) {
    return validationError(result.error);
  }
  const { fromAccountId, toAccountId, amountInCents, ...rest } = result.data;

  const fromAccountBalance = await prisma.transaction.aggregate({
    where: { accountId: result.data.fromAccountId },
    _sum: { amountInCents: true },
  });

  if (fromAccountBalance._sum.amountInCents === null) {
    return toast.json(
      request,
      { message: "Unable to aggregate account balance." },
      {
        variant: "destructive",
        title: "Error transferring funds",
        description: "Unable to aggregate from account balance. Please contact support.",
      },
    );
  }

  const fromAccountBalanceInCents = fromAccountBalance._sum.amountInCents;

  if (amountInCents > fromAccountBalanceInCents) {
    return toast.json(
      request,
      { message: "Insufficient funds in from account." },
      {
        variant: "warning",
        title: "Error transferring funds",
        description: "Insufficient funds in from account.",
      },
    );
  }

  await prisma.$transaction([
    // Transfer out
    prisma.transaction.create({
      data: {
        ...rest,
        accountId: fromAccountId,
        amountInCents: -1 * amountInCents,
        transactionItems: {
          create: {
            amountInCents: -1 * amountInCents,
            typeId: TransactionItemType.Transfer_Out,
          },
        },
      },
    }),
    // Transfer in
    prisma.transaction.create({
      data: {
        ...rest,
        accountId: toAccountId,
        amountInCents: amountInCents,
        transactionItems: {
          create: {
            amountInCents: amountInCents,
            typeId: TransactionItemType.Transfer_In,
          },
        },
      },
    }),
  ]);

  return toast.redirect(request, `/accounts/`, {
    title: "Success",
    description: `Transfer completed successfully.`,
  });
};

export default function AddTransferPage() {
  const { accounts } = useTypedLoaderData<typeof loader>();

  return (
    <>
      <PageHeader title="Add Transfer" />
      <PageContainer>
        <ValidatedForm id="transfer-form" method="post" validator={validator} className="space-y-4 sm:max-w-md">
          <div className="flex flex-wrap items-start gap-2 sm:flex-nowrap">
            <div className="w-auto">
              <FormField required name="date" label="Date" type="date" defaultValue={getToday()} />
            </div>
            <FormField name="description" label="Description" />
          </div>
          <FormSelect
            required
            name="fromAccountId"
            label="From"
            placeholder="Select account"
            options={accounts.map((a) => ({
              value: a.id,
              label: `${a.code} - ${a.description}`,
            }))}
          />
          <FormSelect
            required
            name="toAccountId"
            label="To"
            placeholder="Select account"
            options={accounts.map((a) => ({
              value: a.id,
              label: `${a.code} - ${a.description}`,
            }))}
          />
          <FormField isCurrency required name="amountInCents" label="Amount" className="w-36" />
          <SubmitButton>Submit Transfer</SubmitButton>
        </ValidatedForm>
      </PageContainer>
    </>
  );
}

export function ErrorBoundary() {
  return <ErrorComponent />;
}
