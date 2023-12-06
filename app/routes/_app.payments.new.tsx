import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import type { MetaFunction } from "@remix-run/react";
import { withZod } from "@remix-validated-form/with-zod";
import { IconPlus, IconTrash } from "@tabler/icons-react";
import { nanoid } from "nanoid";
import { typedjson, useTypedLoaderData } from "remix-typedjson";
import { ValidatedForm, setFormDefaults, useFieldArray, useFormContext, validationError } from "remix-validated-form";
import { z } from "zod";

import { ErrorComponent } from "~/components/error-component";
import { PageContainer } from "~/components/page-container";
import { PageHeader } from "~/components/page-header";
import { Button } from "~/components/ui/button";
import { FormField, FormSelect } from "~/components/ui/form";
import { SubmitButton } from "~/components/ui/submit-button";
import { prisma } from "~/integrations/prisma.server";
import { TransactionItemMethod, TransactionItemType } from "~/lib/constants";
import { requireUser } from "~/lib/session.server";
import { toast } from "~/lib/toast.server";
import { getToday, useConsoleLog } from "~/lib/utils";

const transactionItemSchema = z.object({
  typeId: z.coerce.number().transform((val, ctx) => {
    if (!Object.values(TransactionItemType).includes(val)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Invalid type`,
        path: [],
      });
      return z.NEVER;
    }
    return val;
  }),
  methodId: z.coerce.number().transform((val, ctx) => {
    if (!Object.values(TransactionItemMethod).includes(val)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Invalid method`,
      });
      return z.NEVER;
    }
    return val;
  }),
  amountInCents: z.coerce
    .number({ invalid_type_error: "Must be a number", required_error: "Amount required" })
    .nonnegative({ message: "Must be greater than $0" })
    .max(99_999, { message: "Must be less than $100,000" })
    .transform((dollars) => Math.round(dollars * 100)),
  description: z.string().optional().or(z.literal("")),
});

const validator = withZod(
  z.object({
    date: z.coerce.date(),
    accountId: z.string().cuid({ message: "Account required" }),
    transactionItems: z.array(transactionItemSchema),
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
    ...setFormDefaults("payment-form", {
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

  console.log(JSON.parse(JSON.stringify(result.data)));

  const { transactionItems, ...rest } = result.data;
  const total = transactionItems.reduce((acc, i) => acc + i.amountInCents, 0);
  const transaction = await prisma.transaction.create({
    data: {
      ...rest,
      amountInCents: total,
      transactionItems: {
        createMany: {
          data: transactionItems.map((i) => i),
        },
      },
    },
  });

  return toast.redirect(request, `/accounts/${transaction.accountId}`, {
    title: "Success",
    description: "Payment added successfully",
  });
};

export default function NewUserPage() {
  const { accounts, transactionItemMethods } = useTypedLoaderData<typeof loader>();
  const [items, { push, remove }] = useFieldArray("transactionItems", { formId: "payment-form" });
  const ctx = useFormContext("payment-form");

  useConsoleLog("form context: ", ctx);

  return (
    <>
      <PageHeader title="Add Payment" />
      <PageContainer>
        <ValidatedForm
          onSubmit={(data) => console.log(data)}
          id="payment-form"
          method="post"
          validator={validator}
          className="sm:max-w-xl"
        >
          <SubmitButton disabled={items.length === 0}>Submit Payment</SubmitButton>
          <div className="mt-8 space-y-8">
            <div className="space-y-2">
              <div className="flex flex-wrap items-start gap-2 sm:flex-nowrap">
                <div className="w-auto">
                  <FormField name="date" label="Date" type="date" defaultValue={getToday()} />
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
                  <li key={key} className="rounded-xl border border-border p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="font-bold tracking-wider">Item {index + 1}</p>
                      <Button className="group" onClick={() => remove(index)} variant="link" type="button">
                        <span className="sr-only">Remove transaction item</span>
                        <IconTrash className="h-4 w-4 text-foreground opacity-50 group-hover:text-destructive group-hover:opacity-100" />
                      </Button>
                    </div>
                    <input type="hidden" name={`${fieldPrefix}.id`} />
                    <input type="hidden" name={`${fieldPrefix}.typeId`} value={TransactionItemType.Compensation} />
                    <fieldset className="space-y-3">
                      <FormField name={`${fieldPrefix}.description`} label="Description" />
                      <div className="grid grid-cols-4 items-start gap-2">
                        <div className="col-span-1">
                          <FormField required name={`${fieldPrefix}.amountInCents`} label="Amount" isCurrency />
                        </div>
                        <FormSelect
                          divProps={{ className: "col-span-3" }}
                          required
                          name={`${fieldPrefix}.methodId`}
                          label="Method"
                          placeholder="Select method"
                          options={transactionItemMethods.map((t) => ({
                            value: t.id,
                            label: t.name,
                          }))}
                        />
                      </div>
                    </fieldset>
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
