import { Prisma, TransactionItemTypeDirection } from "@prisma/client";
import { type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";
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
import { Checkbox } from "~/components/ui/checkbox";
import { FormField, FormSelect } from "~/components/ui/form";
import { Label } from "~/components/ui/label";
import { Separator } from "~/components/ui/separator";
import { SubmitButton } from "~/components/ui/submit-button";
import { db } from "~/integrations/prisma.server";
import { Sentry } from "~/integrations/sentry";
import { notifySubscribersJob } from "~/jobs/notify-subscribers.server";
import { TransactionItemType } from "~/lib/constants";
import { getPrismaErrorText } from "~/lib/responses.server";
import { toast } from "~/lib/toast.server";
import { formatCentsAsDollars, getToday } from "~/lib/utils";
import { CheckboxSchema, TransactionItemSchema } from "~/models/schemas";
import { getContactTypes } from "~/services.server/contact";
import { SessionService } from "~/services.server/session";
import { generateTransactionItems, getTransactionItemMethods } from "~/services.server/transaction";

const validator = withZod(
  z.object({
    date: z.coerce.date(),
    description: z.string().optional(),
    shouldNotifyUser: CheckboxSchema,
    accountId: z.string().cuid({ message: "Account required" }),
    contactId: z.string().optional(),
    transactionItems: z.array(TransactionItemSchema),
  }),
);

export const meta: MetaFunction = () => [{ title: "Add Income" }];

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await SessionService.requireAdmin(request);
  const orgId = await SessionService.requireOrgId(request);

  const [contacts, contactTypes, accounts, transactionItemMethods, transactionItemTypes] = await Promise.all([
    db.contact.findMany({ where: { orgId }, include: { type: true } }),
    getContactTypes(orgId),
    db.account.findMany({ where: { orgId }, orderBy: { code: "asc" } }),
    getTransactionItemMethods(orgId),
    db.transactionItemType.findMany({
      where: {
        AND: [
          { OR: [{ orgId }, { orgId: null }] },
          { OR: [{ direction: TransactionItemTypeDirection.IN }, { id: TransactionItemType.Fee }] },
        ],
      },
    }),
  ]);
  return typedjson({
    contacts,
    contactTypes,
    accounts,
    transactionItemMethods,
    transactionItemTypes,
    ...setFormDefaults("income-form", {
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
  const { transactionItems, shouldNotifyUser, contactId, ...rest } = result.data;
  try {
    const { transactionItems: trxItems, totalInCents } = await generateTransactionItems(transactionItems, orgId);

    const transaction = await db.transaction.create({
      data: {
        contactId: contactId || undefined,
        amountInCents: totalInCents,
        transactionItems: { createMany: { data: trxItems } },
        orgId,
        ...rest,
      },
      select: {
        account: {
          select: {
            code: true,
            id: true,
            user: {
              select: {
                contact: {
                  select: {
                    email: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (shouldNotifyUser) {
      const email = transaction.account.user?.contact.email;
      if (!email) {
        return toast.json(
          request,
          { message: "Error notifying subscribers" },
          {
            type: "error",
            title: "Error notifying subscribers",
            description: "We couldn't find the account for this transaction. Please contact support.",
          },
          { status: 404 },
        );
      }

      const key = nanoid();
      await notifySubscribersJob.invoke({ to: email, orgId }, { idempotencyKey: key });
    }

    return toast.redirect(request, `/accounts/${transaction.account.id}`, {
      type: "success",
      title: "Success",
      description: `Income of ${formatCentsAsDollars(totalInCents)} added to account ${transaction.account.code}`,
    });
  } catch (error) {
    console.error(error);
    Sentry.captureException(error);
    let description = "An error occurred while creating the expense";
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      description = getPrismaErrorText(error);
    }
    return toast.redirect(request, "/expense/new", {
      type: "error",
      title: "Error creating expense",
      description,
    });
  }
};

export default function AddIncomePage() {
  const { contacts, contactTypes, accounts, transactionItemMethods, transactionItemTypes } =
    useTypedLoaderData<typeof loader>();
  const [items, { push, remove }] = useFieldArray("transactionItems", { formId: "income-form" });

  return (
    <>
      <PageHeader title="Add Income" />
      <PageContainer>
        <ValidatedForm id="income-form" method="post" validator={validator} className="sm:max-w-xl">
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
              <ContactDropdown types={contactTypes} contacts={contacts} name="contactId" label="Contact" />
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
                          <div className="grid grid-cols-10 gap-2">
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
            <Separator className="my-4" />
            <div>
              <div>
                <Label className="mb-2 inline-flex cursor-pointer items-center gap-2">
                  <Checkbox name="shouldNotifyUser" aria-label="Notify User" />
                  <span>Notify User</span>
                </Label>
              </div>
              <SubmitButton disabled={items.length === 0}>Submit Income</SubmitButton>
            </div>
          </div>
        </ValidatedForm>
      </PageContainer>
    </>
  );
}

export function ErrorBoundary() {
  return <ErrorComponent />;
}
