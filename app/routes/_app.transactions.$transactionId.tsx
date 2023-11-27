import { Prisma } from "@prisma/client";
import { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { withZod } from "@remix-validated-form/with-zod";
import dayjs from "dayjs";
import { Fragment, useState } from "react";
import { redirect, typedjson, useTypedLoaderData } from "remix-typedjson";
import { ValidatedForm, setFormDefaults, validationError } from "remix-validated-form";
import invariant from "tiny-invariant";
import { z } from "zod";

import { ConfirmDestructiveModal } from "~/components/modals/confirm-destructive-modal";
import { PageContainer } from "~/components/page-container";
import { PageHeader } from "~/components/page-header";
import { Button } from "~/components/ui/button";
import { ButtonGroup } from "~/components/ui/button-group";
import { Field } from "~/components/ui/form";
import { Select } from "~/components/ui/select";
import { SubmitButton } from "~/components/ui/submit-button";
import { prisma } from "~/integrations/prisma.server";
import { notFound } from "~/lib/responses.server";
import { requireUser } from "~/lib/session.server";
import { toast } from "~/lib/toast.server";
import { cn, formatCurrency, useUser } from "~/lib/utils";

const validator = withZod(
  z.object({
    id: z.string().cuid(),
    accountId: z.string(),
    description: z.string().optional(),
    _action: z.enum(["delete", "update"]),
  }),
);

export const loader = async ({ params, request }: LoaderFunctionArgs) => {
  await requireUser(request, ["ADMIN", "ACCOUNTANT", "OWNER", "SUPERADMIN"]);
  invariant(params.transactionId, "transactionId not found");

  const transaction = await prisma.transaction.findUnique({
    where: { id: params.transactionId },
    include: {
      account: true,
      transactionItems: {
        include: { donor: true, type: true },
      },
    },
  });
  if (!transaction) throw notFound({ message: "Transaction not found" });

  const accounts = await prisma.account.findMany({
    where: { organizationId: transaction.account.organizationId },
  });

  return typedjson({
    transaction,
    accounts,
    ...setFormDefaults("transactionForm", { ...transaction }),
  });
};

export const meta: MetaFunction = () => [{ title: "Transaction Details • Alliance 436" }];

export const action = async ({ params, request }: ActionFunctionArgs) => {
  await requireUser(request, ["ACCOUNTANT", "ADMIN", "OWNER", "SUPERADMIN"]);
  const result = await validator.validate(await request.formData());
  if (result.error) return validationError(result.error);

  const { transactionId } = params;
  const { _action, ...data } = result.data;

  const transaction = await prisma.transaction.findUnique({
    where: { id: transactionId },
  });

  if (!transaction) throw notFound({ message: "Transaction not found" });

  if (_action === "delete") {
    await prisma.transaction.delete({ where: { id: transactionId } });
    return redirect("/transactions");
  }

  const updatedTransaction = await prisma.transaction.update({
    where: { id: transactionId },
    data,
  });

  return toast.json(
    request,
    { user: updatedTransaction },
    {
      variant: "default",
      title: "Transaction updated",
      description: "Great job.",
    },
  );
};

export default function UserDetailsPage() {
  const sessionUser = useUser();
  const { transaction, accounts } = useTypedLoaderData<typeof loader>();
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <PageHeader title="Transaction Details" description={transaction.id}>
        <div className="flex items-center gap-2">
          {["SUPERADMIN", "ADMIN", "ACCOUNTANT", "OWNER"].includes(sessionUser.role) ? (
            <ConfirmDestructiveModal
              open={modalOpen}
              onOpenChange={setModalOpen}
              description="This action cannot be undone. This will permanently delete the
                  transaction and its items, and remove the data from the server."
            />
          ) : null}
        </div>
      </PageHeader>

      <PageContainer>
        <div className="space-y-8">
          <div>
            <h2 className="sr-only">Details</h2>
            <dl className="divide-y divide-muted">
              <DetailItem label="Total" value={formatCurrency(transaction.amount, 2)} />
              <DetailItem label="Created" value={dayjs(transaction.createdAt).format("MM/DD/YYYY")} />
            </dl>
          </div>

          <div>
            <h2>Line Items</h2>
            <dl className="divide-y divide-muted">
              {transaction.transactionItems.map((item, index) => {
                return (
                  <Fragment key={item.id}>
                    <span>{index + 1}</span>
                    <DetailItem label="Amount" value={formatCurrency(item.amount, 2)} />
                    <DetailItem label="Type" value={item.type.name} />
                    {item.donor ? <DetailItem label="Donor" value={item.donor.name} /> : null}
                  </Fragment>
                );
              })}
            </dl>
          </div>
        </div>

        <ValidatedForm id="transactionForm" validator={validator} method="post" className="space-y-4 sm:max-w-md">
          <input type="hidden" name="id" value={transaction.id} />
          <Field label="Description" name="description" />
          <Select
            name="accountId"
            label="Account"
            placeholder="Select an account"
            options={accounts.map((a) => ({
              value: a.id,
              label: a.name,
            }))}
          />
          <ButtonGroup>
            <SubmitButton className="w-full" name="_action" value="update">
              Save Transaction
            </SubmitButton>
            <Button type="reset" variant="outline">
              Reset
            </Button>
          </ButtonGroup>
        </ValidatedForm>
      </PageContainer>
    </>
  );
}

function DetailItem({ label, value }: { label: string; value: Prisma.JsonValue }) {
  return (
    <div className="py-2 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
      <dt className="text-sm font-semibold capitalize">{label}</dt>
      <dd className={cn("mt-1 text-sm sm:col-span-2 sm:mt-0", value ? "" : "text-muted-foreground")}>
        {String(value)}
      </dd>
    </div>
  );
}
