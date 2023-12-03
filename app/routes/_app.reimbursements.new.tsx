import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { type MetaFunction } from "@remix-run/react";
import { withZod } from "@remix-validated-form/with-zod";
import dayjs from "dayjs";
import { typedjson, useTypedLoaderData } from "remix-typedjson";
import { ValidatedForm, validationError } from "remix-validated-form";
import { z } from "zod";

import { FileUploader } from "~/components/file-uploader";
import { PageContainer } from "~/components/page-container";
import { PageHeader } from "~/components/page-header";
import { Field, FormSelect } from "~/components/ui/form";
import { Separator } from "~/components/ui/separator";
import { SubmitButton } from "~/components/ui/submit-button";
import { prisma } from "~/integrations/prisma.server";
import { TransactionItemMethod } from "~/lib/constants";
import { requireUser } from "~/lib/session.server";
import { getToday, useUser } from "~/lib/utils";

const validator = withZod(
  z.object({
    date: z.coerce.date(),
    vendor: z.string().optional(),
    description: z.string().optional(),
    amount: z.coerce.number().positive(),
    accountId: z.string().cuid(),
    receiptId: z.string().cuid().optional(),
    methodId: z
      .string()
      .transform((v) => Number(v))
      .pipe(z.nativeEnum(TransactionItemMethod)),
  }),
);

export const meta: MetaFunction = () => [{ title: "New Transaction • Alliance 436" }];

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const user = await requireUser(request);
  const [receipts, methods, accounts] = await Promise.all([
    prisma.receipt.findMany({
      // Admins can see all receipts, users can only see their own
      where: {
        userId: user.role === "USER" ? user.id : undefined,
        reimbursementRequests: { none: {} },
      },
      include: { user: { select: { contact: { select: { email: true } } } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.transactionItemMethod.findMany(),
    prisma.account.findMany({ where: { userId: user.id }, include: { type: true } }),
  ]);
  return typedjson({ receipts, methods, accounts });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const user = await requireUser(request);
  const result = await validator.validate(await request.formData());
  if (result.error) {
    return validationError(result.error);
  }

  const { receiptId, ...data } = result.data;

  const reimbursementRequest = await prisma.reimbursementRequest.create({
    data: {
      ...data,
      userId: user.id,
      status: "PENDING",
      receipts: {
        connect: { id: receiptId },
      },
    },
  });

  return typedjson({ reimbursementRequest });
};

export default function NewUserPage() {
  const { receipts, methods, accounts } = useTypedLoaderData<typeof loader>();
  const user = useUser();

  return (
    <>
      <PageHeader title="New Reimbursement Request" />
      <PageContainer>
        <h2 id="receipts-label" className="mb-1 font-bold">
          Upload Receipt
        </h2>
        <FileUploader />
        <p className="mt-1 text-xs text-muted-foreground">
          After uploading, your file will appear in the dropdown below.
        </p>
        <Separator className="my-8" />

        <ValidatedForm method="post" validator={validator} className="space-y-4 sm:max-w-xl">
          <div className="flex flex-wrap items-start gap-2 sm:flex-nowrap">
            <Field name="vendor" label="Vendor" />
            <Field name="description" label="Description" />
          </div>
          <div className="flex flex-wrap items-start gap-2 sm:flex-nowrap">
            <div className="w-auto">
              <Field name="date" label="Date" type="date" defaultValue={getToday()} required />
            </div>
            <div className="w-auto min-w-[3rem]">
              <Field name="amount" label="Amount" required />
            </div>
            <FormSelect
              required
              name="methodId"
              label="Method"
              placeholder="Select method"
              options={methods.map((t) => ({
                value: t.id,
                label: t.name,
              }))}
            />
          </div>
          <div className="flex flex-wrap items-start gap-2 sm:flex-nowrap">
            <FormSelect
              required
              name="accountId"
              label="Account"
              placeholder="Select account"
              options={accounts.map((t) => ({
                value: t.id,
                label: `${t.code} - ${t.type.name}`,
              }))}
            />
            <FormSelect
              name="receiptId"
              label="Receipt"
              placeholder="Select a receipt"
              className="max-w-[400px]"
              options={receipts.map((r) => ({
                value: r.id,
                label: (
                  <span className="inline-block">
                    {r.title}{" "}
                    <span className="inline-block text-xs text-muted-foreground">
                      {dayjs(r.createdAt).format("MM/D h:mm A")}
                      {user.role !== "USER" ? ` by ${r.user.contact.email}` : null}
                    </span>
                  </span>
                ),
              }))}
            />
          </div>

          <SubmitButton>Submit</SubmitButton>
        </ValidatedForm>
      </PageContainer>
    </>
  );
}
