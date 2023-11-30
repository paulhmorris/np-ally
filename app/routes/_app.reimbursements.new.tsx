import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { type MetaFunction } from "@remix-run/react";
import { withZod } from "@remix-validated-form/with-zod";
import { typedjson, useTypedLoaderData } from "remix-typedjson";
import { ValidatedForm, validationError } from "remix-validated-form";
import { z } from "zod";

import { FileUploader } from "~/components/file-uploader";
import { PageContainer } from "~/components/page-container";
import { PageHeader } from "~/components/page-header";
import { Field } from "~/components/ui/form";
import { Select } from "~/components/ui/select";
import { Separator } from "~/components/ui/separator";
import { SubmitButton } from "~/components/ui/submit-button";
import { prisma } from "~/integrations/prisma.server";
import { requireUser, requireUserId } from "~/lib/session.server";
import { getToday, useUser } from "~/lib/utils";

const validator = withZod(
  z.object({
    amount: z.coerce.number().positive(),
    description: z.string().optional(),
    contactId: z.string().cuid(),
    date: z.coerce.date(),
    receipts: z.array(z.string()),
  }),
);

export const meta: MetaFunction = () => [{ title: "New Transaction • Alliance 436" }];

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const userId = await requireUserId(request);
  const receipts = await prisma.receipt.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
  return typedjson({ receipts });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  await requireUser(request, ["ADMIN", "SUPERADMIN"]);
  const result = await validator.validate(await request.formData());
  if (result.error) {
    return validationError(result.error);
  }
  console.log(result.data);

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
  const { receipts } = useTypedLoaderData<typeof loader>();
  const { contactId } = useUser();

  return (
    <>
      <PageHeader title="New Reimbursement Request" />
      <PageContainer>
        <h2 id="receipts-label" className="mb-1 font-bold">
          Upload Receipt
        </h2>
        <FileUploader />
        <Separator className="my-8" />

        <ValidatedForm method="post" validator={validator} className="space-y-6 sm:max-w-xl">
          <input type="hidden" name="contactId" value={contactId} />
          <div className="flex flex-wrap items-start gap-2 sm:flex-nowrap">
            <div className="w-auto">
              <Field name="date" label="Date" type="date" defaultValue={getToday()} required />
            </div>
            <Field name="description" label="Description" />
          </div>
          <div className="flex flex-wrap items-start gap-2 sm:flex-nowrap">
            <div className="w-auto">
              <Field name="amount" label="Amount" required />
            </div>
            <Select
              name="receipt"
              label="Receipt"
              placeholder="Select a receipt"
              options={receipts.map((c) => ({
                value: c.id,
                label: `${c.title} - (uploaded ${c.createdAt.toLocaleDateString()})`,
              }))}
            />
          </div>

          <SubmitButton>Submit</SubmitButton>
        </ValidatedForm>
      </PageContainer>
    </>
  );
}
