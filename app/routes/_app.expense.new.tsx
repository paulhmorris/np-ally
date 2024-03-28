import { TransactionItemTypeDirection } from "@prisma/client";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import type { MetaFunction } from "@remix-run/react";
import { withZod } from "@remix-validated-form/with-zod";
import { IconPlus } from "@tabler/icons-react";
import { nanoid } from "nanoid";
import { typedjson, useTypedLoaderData } from "remix-typedjson";
import { ValidatedForm, setFormDefaults, useFieldArray, validationError } from "remix-validated-form";
import { z } from "zod";

import { ContactDropdown } from "~/components/contacts/contact-dropdown";
import { ErrorComponent } from "~/components/error-component";
import { PageContainer } from "~/components/page-container";
import { PageHeader } from "~/components/page-header";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "~/components/ui/card";
import { FormField, FormSelect } from "~/components/ui/form";
import { Separator } from "~/components/ui/separator";
import { SubmitButton } from "~/components/ui/submit-button";
import { db } from "~/integrations/prisma.server";
import { toast } from "~/lib/toast.server";
import { formatCentsAsDollars, getToday } from "~/lib/utils";
import { TransactionItemSchema } from "~/models/schemas";
import { SessionService } from "~/services/SessionService.server";
import { TransactionService } from "~/services/TransactionService.server";

const validator = withZod(
  z.object({
    date: z.coerce.date(),
    description: z.string().optional(),
    accountId: z.string().cuid({ message: "Account required" }),
    contactId: z.string().optional(),
    transactionItems: z.array(TransactionItemSchema),
  }),
);

export const meta: MetaFunction = () => [{ title: "Add Expense | Alliance 436" }];

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await SessionService.requireAdmin(request);
  const orgId = await SessionService.requireOrgId(request);

  const [contacts, contactTypes, accounts, transactionItemMethods, transactionItemTypes] = await Promise.all([
    db.contact.findMany({ where: { orgId }, include: { type: true } }),
    db.contactType.findMany({ where: { orgId } }),
    db.account.findMany({ where: { orgId }, orderBy: { code: "asc" } }),
    TransactionService.getItemMethods({ where: { orgId } }),
    TransactionService.getItemTypes({ where: { direction: TransactionItemTypeDirection.OUT, orgId } }),
  ]);

  return typedjson({
    accounts,
    transactionItemMethods,
    transactionItemTypes,
    contacts,
    contactTypes,
    ...setFormDefaults("expense-form", {
      transactionItems: [{ id: nanoid() }],
    }),
  });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  await SessionService.requireAdmin(request);
  const orgId = await SessionService.requireOrgId(request);

  const result = await validator.validate(await request.formData());
  if (result.error) {
    return validationError(result.error);
  }

  const { transactionItems, accountId, contactId, ...rest } = result.data;
  const total = transactionItems.reduce((acc, i) => acc - i.amountInCents, 0);
  const transaction = await db.transaction.create({
    data: {
      ...rest,
      orgId,
      accountId,
      contactId,
      amountInCents: total,
      transactionItems: {
        createMany: {
          data: transactionItems.map((i) => ({
            ...i,
            orgId,
            amountInCents: i.amountInCents * -1,
          })),
        },
      },
    },
    include: { account: true },
  });

  return toast.redirect(request, `/accounts/${transaction.accountId}`, {
    type: "success",
    title: "Success",
    description: `Expense of ${formatCentsAsDollars(total)} charged to account ${transaction.account.code}`,
  });
};

export default function AddExpensePage() {
  const { contacts, contactTypes, accounts, transactionItemMethods, transactionItemTypes } =
    useTypedLoaderData<typeof loader>();
  const [items, { push, remove }] = useFieldArray("transactionItems", { formId: "expense-form" });

  return (
    <>
      <PageHeader title="Add Expense" />
      <PageContainer>
        <ValidatedForm id="expense-form" method="post" validator={validator} className="sm:max-w-xl">
          <div className="mt-8 space-y-8">
            <div className="space-y-2">
              <div className="flex flex-wrap items-start gap-2 sm:flex-nowrap">
                <div className="w-auto">
                  <FormField required name="date" label="Date" type="date" defaultValue={getToday()} />
                </div>
                <FormField
                  name="description"
                  label="Description"
                  description="Will be shown on transaction tables and reports"
                />
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
              <ContactDropdown types={contactTypes} contacts={contacts} name="contactId" label="Payable To" />
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
                            <div className="col-span-3 sm:col-span-2">
                              <FormField required name={`${fieldPrefix}.amountInCents`} label="Amount" isCurrency />
                            </div>
                            <FormSelect
                              divProps={{ className: "col-span-3 sm:col-span-4" }}
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
                              options={transactionItemTypes.map((t) => ({
                                value: t.id,
                                label: t.name,
                              }))}
                            />
                          </div>
                          <FormField
                            name={`${fieldPrefix}.description`}
                            label="Description"
                            description="Will only be shown in transaction details and reports"
                          />
                        </fieldset>
                      </CardContent>
                      <CardFooter>
                        <Button
                          aria-label={`Remove item ${index + 1}`}
                          onClick={() => remove(index)}
                          variant="destructive"
                          type="button"
                          className="ml-auto"
                        >
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
            <Separator />
            <SubmitButton disabled={items.length === 0}>Submit Expense</SubmitButton>
          </div>
        </ValidatedForm>
      </PageContainer>
    </>
  );
}

export function ErrorBoundary() {
  return <ErrorComponent />;
}
