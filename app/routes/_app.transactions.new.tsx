import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import type { MetaFunction } from "@remix-run/react";
import { isRouteErrorResponse, useRouteError } from "@remix-run/react";
import { withZod } from "@remix-validated-form/with-zod";
import { IconPlus } from "@tabler/icons-react";
import { nanoid } from "nanoid";
import { useEffect } from "react";
import { typedjson, useTypedLoaderData } from "remix-typedjson";
import { ValidatedForm, setFormDefaults, useFieldArray, validationError } from "remix-validated-form";
import { z } from "zod";

import { PageContainer } from "~/components/page-container";
import { PageHeader } from "~/components/page-header";
import { Button } from "~/components/ui/button";
import { DatePicker } from "~/components/ui/date-picker";
import { Label } from "~/components/ui/label";
import { Select } from "~/components/ui/select";
import { Separator } from "~/components/ui/separator";
import { SubmitButton } from "~/components/ui/submit-button";
import { prisma } from "~/integrations/prisma.server";
import { requireUser } from "~/lib/session.server";

const validator = withZod(
  z.object({
    date: z.string().datetime(),
    amount: z.number(),
    accountId: z.string().min(1, { message: "Please select an account" }),
    transactionItems: z.array(
      z.object({
        amount: z.number(),
        description: z.string().optional(),
        donorId: z.string().cuid().optional(),
        typeId: z.string(),
      }),
    ),
  }),
);

export const meta: MetaFunction = () => [{ title: "New Transaction • Alliance 436" }];

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await requireUser(request, ["OWNER", "SUPERADMIN", "ACCOUNTANT"]);
  const [donors, transactionItemTypes] = await Promise.all([
    prisma.donor.findMany({
      where: { isActive: true },
    }),
    prisma.transactionItemType.findMany(),
  ]);
  return typedjson({
    donors,
    transactionItemTypes,
    ...setFormDefaults("transactionForm", {
      transactionItems: [{ id: nanoid() }],
    }),
  });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  await requireUser(request, ["SUPERADMIN"]);
  const result = await validator.validate(await request.formData());
  if (result.error) return validationError(result.error);

  console.log(result);
  // const { transactionItems, ...rest } = result.data;
  // const trx = await prisma.transaction.create({
  //   data: {
  //     ...rest,
  //     transactionItems: {
  //       createMany: {
  //         data: transactionItems,
  //       },
  //     },
  //   },
  // });
  // return redirect(`/transactions/${trx.id}`);
  return typedjson({});
};

export default function NewUserPage() {
  const { donors, transactionItemTypes } = useTypedLoaderData<typeof loader>();
  const [items, { push }] = useFieldArray("transactionItems", { formId: "transactionForm" });

  useEffect(() => {
    console.log(items);
  }, [items]);

  return (
    <>
      <PageHeader title="New Transaction" />
      <PageContainer>
        <ValidatedForm id="transactionForm" validator={validator} method="post" className="sm:max-w-md">
          <div className="mb-8 flex items-center gap-2">
            <SubmitButton>Create</SubmitButton>
            <Button variant="outline" type="button" className="flex items-center gap-2" onClick={() => push({ id: nanoid() })}>
              <IconPlus className="h-4 w-4" />
              <span>Add item</span>
            </Button>
          </div>
          {items.map(({ defaultValue, key }, index) => {
            return (
              <div key={key}>
                <p className="mb-2 text-lg">Item {index}</p>
                <div className="space-y-4">
                  <div className="w-full space-y-1">
                    <Label htmlFor="date" className="block">
                      Date
                    </Label>
                    <DatePicker name={`transactionItems[${index}].date`} />
                  </div>
                  <Select
                    name={`transactionItems[${index}].typeId`}
                    label="Type"
                    placeholder="Select a type"
                    options={transactionItemTypes.map((t) => ({
                      value: t.id,
                      label: t.name,
                    }))}
                  />
                  <Select name="donorId" label="Donor" placeholder="Select a donor" options={donors.map((c) => ({ value: c.id, label: c.name }))} />
                  <input
                    type="hidden"
                    name={`todos[${index}].id`}
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
                    value={defaultValue.id}
                  />
                </div>
                {items.length > 1 ? <Separator className="my-8" /> : null}
              </div>
            );
          })}
        </ValidatedForm>
      </PageContainer>
    </>
  );
}

export function ErrorBoundary() {
  const error = useRouteError();

  if (error instanceof Error) {
    return <p className="font-medium text-destructive">An unexpected error occurred: {error.message}</p>;
  }

  if (!isRouteErrorResponse(error)) {
    return <h1>Unknown Error</h1>;
  }

  if (error.status === 404) {
    return <div>Client not found</div>;
  }

  return <div>An unexpected error occurred: {error.statusText}</div>;
}
