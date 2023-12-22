import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import type { MetaFunction } from "@remix-run/react";
import { withZod } from "@remix-validated-form/with-zod";
import { IconPlus } from "@tabler/icons-react";
import { nanoid } from "nanoid";
import { typedjson, useTypedLoaderData } from "remix-typedjson";
import { ValidatedForm, setFormDefaults, useFieldArray, validationError } from "remix-validated-form";
import { z } from "zod";

import { ErrorComponent } from "~/components/error-component";
import { PageContainer } from "~/components/page-container";
import { PageHeader } from "~/components/page-header";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "~/components/ui/card";
import { FormField, FormSelect } from "~/components/ui/form";
import { SubmitButton } from "~/components/ui/submit-button";
import { prisma } from "~/integrations/prisma.server";
import { TransactionItemType } from "~/lib/constants";
import { requireUser } from "~/lib/session.server";
import { toast } from "~/lib/toast.server";
import { formatCentsAsDollars, getToday } from "~/lib/utils";
import { TransactionItemSchema } from "~/models/schemas";

const validator = withZod(
  z.object({
    date: z.coerce.date(),
    description: z.string().optional(),
    accountId: z.string().cuid({ message: "Account required" }),
    transactionItems: z.array(TransactionItemSchema.pick({ amountInCents: true, typeId: true, description: true })),
  }),
);

export const meta: MetaFunction = () => [{ title: "New Transaction • Alliance 436" }];

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await requireUser(request, ["SUPERADMIN", "ADMIN"]);
  const [accounts, transactionItemMethods] = await Promise.all([
    prisma.account.findMany(),
    prisma.transactionItemMethod.findMany(),
  ]);

  return typedjson({
    accounts,
    transactionItemMethods,
    ...setFormDefaults("expense-form", {
      transactionItems: [{ id: nanoid() }],
    }),
  });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  await requireUser(request, ["ADMIN", "SUPERADMIN"]);
  const result = await validator.validate(await request.formData());
  if (result.error) {
    return validationError(result.error);
  }

  const { transactionItems, ...rest } = result.data;
  const total = -1 * transactionItems.reduce((acc, i) => acc + i.amountInCents, 0);
  const transaction = await prisma.transaction.create({
    data: {
      ...rest,
      amountInCents: total,
      transactionItems: {
        createMany: {
          data: transactionItems.map((i) => ({
            ...i,
            amountInCents: i.amountInCents * -1,
          })),
        },
      },
    },
    include: { account: true },
  });

  return toast.redirect(request, `/accounts/${transaction.accountId}`, {
    title: "Success",
    description: `Expense of ${formatCentsAsDollars(total)} charged to account ${transaction.account.code}`,
  });
};

export default function AddExpensePage() {
  const { accounts, transactionItemMethods } = useTypedLoaderData<typeof loader>();
  const [items, { push, remove }] = useFieldArray("transactionItems", { formId: "expense-form" });

  return (
    <>
      <PageHeader title="Add Expense" />
      <PageContainer>
        <ValidatedForm id="expense-form" method="post" validator={validator} className="sm:max-w-xl">
          <SubmitButton disabled={items.length === 0}>Submit Expense</SubmitButton>
          <div className="mt-8 space-y-8">
            <div className="space-y-2">
              <div className="flex flex-wrap items-start gap-2 sm:flex-nowrap">
                <div className="w-auto">
                  <FormField required name="date" label="Date" type="date" defaultValue={getToday()} />
                </div>
                <FormField name="description" label="Description" />
              </div>
              <FormSelect
                required
                name="accountId"
                label="Account"
                placeholder="Select account"
                options={accounts.map((a) => ({
                  value: a.id,
                  label: `${a.code} - ${a.description}`,
                }))}
              />
            </div>
            <ul className="flex flex-col gap-4">
              {items.map(({ key }, index) => {
                const fieldPrefix = `transactionItems[${index}]`;
                return (
                  <li key={key}>
                    <Card>
                      <CardHeader>
                        <CardTitle>Item {index + 1}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <input type="hidden" name={`${fieldPrefix}.id`} />
                        <fieldset className="space-y-3">
                          <div className="grid grid-cols-10 items-start gap-2">
                            <div className="col-span-2">
                              <FormField required name={`${fieldPrefix}.amountInCents`} label="Amount" isCurrency />
                            </div>
                            <FormSelect
                              divProps={{ className: "col-span-4" }}
                              required
                              name={`${fieldPrefix}.methodId`}
                              label="Method"
                              placeholder="Select method"
                              options={transactionItemMethods.map((t) => ({
                                value: t.id,
                                label: t.name,
                              }))}
                            />
                            <FormSelect
                              divProps={{ className: "col-span-4" }}
                              required
                              name={`${fieldPrefix}.typeId`}
                              label="Type"
                              placeholder="Select type"
                              options={[
                                { label: "Expense", value: TransactionItemType.Expense },
                                { label: "Compensation", value: TransactionItemType.Compensation },
                                { label: "Grant", value: TransactionItemType.Grant },
                                { label: "Tax", value: TransactionItemType.Tax },
                              ]}
                            />
                          </div>
                          <FormField name={`${fieldPrefix}.description`} label="Description" />
                        </fieldset>
                      </CardContent>
                      <CardFooter>
                        <Button onClick={() => remove(index)} variant="destructive" type="button" className="ml-auto">
                          Remove
                        </Button>
                      </CardFooter>
                    </Card>
                  </li>
                );
              })}
            </ul>
            <Button
              onClick={() => push({ id: nanoid() })}
              variant="outline"
              className="flex items-center gap-2"
              type="button"
            >
              <IconPlus className="h-4 w-4" />
              <span>Add item</span>
            </Button>
          </div>
        </ValidatedForm>
      </PageContainer>
    </>
  );
}

export function ErrorBoundary() {
  return <ErrorComponent />;
}
