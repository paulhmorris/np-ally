import { ReimbursementRequestStatus } from "@prisma/client";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { type MetaFunction } from "@remix-run/react";
import { withZod } from "@remix-validated-form/with-zod";
import dayjs from "dayjs";
import { typedjson, useTypedLoaderData } from "remix-typedjson";
import { ValidatedForm, validationError } from "remix-validated-form";
import { z } from "zod";
import { zfd } from "zod-form-data";

import { ErrorComponent } from "~/components/error-component";
import { FileUploader } from "~/components/file-uploader";
import { PageContainer } from "~/components/page-container";
import { PageHeader } from "~/components/page-header";
import { Callout } from "~/components/ui/callout";
import { FormField, FormSelect, FormTextarea } from "~/components/ui/form";
import { Separator } from "~/components/ui/separator";
import { SubmitButton } from "~/components/ui/submit-button";
import { useUser } from "~/hooks/useUser";
import { db } from "~/integrations/prisma.server";
import { reimbursementRequestJob } from "~/jobs/reimbursement-request.server";
import { TransactionItemMethod } from "~/lib/constants";
import { toast } from "~/lib/toast.server";
import { getToday } from "~/lib/utils";
import { CurrencySchema } from "~/models/schemas";
import { SessionService } from "~/services.server/session";
import { getTransactionItemMethods } from "~/services.server/transaction";

const validator = withZod(
  z.object({
    date: z.coerce.date(),
    vendor: z.string().optional(),
    description: z.string().optional(),
    amountInCents: CurrencySchema,
    accountId: z.string().cuid(),
    receiptId: zfd.text(z.string().cuid().optional()),
    methodId: z.coerce.number().pipe(z.nativeEnum(TransactionItemMethod)),
  }),
);

export const meta: MetaFunction = () => [{ title: "New Reimbursement Request" }];

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const user = await SessionService.requireUser(request);
  const orgId = await SessionService.requireOrgId(request);

  const [receipts, methods, accounts] = await Promise.all([
    db.receipt.findMany({
      // Admins can see all receipts, users can only see their own
      where: {
        orgId,
        userId: user.isMember ? user.id : undefined,
        reimbursementRequests: { none: {} },
      },
      include: { user: { select: { contact: { select: { email: true } } } } },
      orderBy: { createdAt: "desc" },
    }),
    getTransactionItemMethods(orgId),
    db.account.findMany({
      where: { user: user.isMember ? { id: user.id } : undefined, orgId },
      include: { type: true },
      orderBy: { code: "asc" },
    }),
  ]);
  return typedjson({ receipts, methods, accounts });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const user = await SessionService.requireUser(request);
  const orgId = await SessionService.requireOrgId(request);

  const result = await validator.validate(await request.formData());
  if (result.error) {
    return validationError(result.error);
  }

  const { receiptId, ...data } = result.data;

  const reimbursementRequest = await db.reimbursementRequest.create({
    data: {
      ...data,
      orgId,
      userId: user.id,
      status: ReimbursementRequestStatus.PENDING,
      receipts: receiptId
        ? {
            connect: {
              id: receiptId,
            },
          }
        : undefined,
    },
  });

  await reimbursementRequestJob.invoke({
    reimbursementRequestId: reimbursementRequest.id,
  });

  return toast.redirect(request, `/dashboards/${user.isMember ? "staff" : "admin"}`, {
    type: "success",
    title: "Reimbursement request submitted",
    description: "Your request will be processed as soon as possible.",
  });
};

export default function NewReimbursementPage() {
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

        <ValidatedForm id="reimbursement-form" method="post" validator={validator} className="space-y-4 sm:max-w-xl">
          <FormField name="vendor" label="Vendor" />
          <FormTextarea name="description" label="Description" />
          <div className="flex flex-wrap items-start gap-2 sm:flex-nowrap">
            <div className="w-auto">
              <FormField name="date" label="Date" type="date" defaultValue={getToday()} required />
            </div>
            <div className="w-auto min-w-[3rem]">
              <FormField name="amountInCents" label="Amount" required isCurrency />
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
              description="The account that will be deducted."
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
                      {dayjs(r.createdAt).format("M/D")}
                      {!user.isMember ? ` by ${r.user.contact.email}` : null}
                    </span>
                  </span>
                ),
              }))}
            />
          </div>
          <Callout variant="warning">
            High quality images of itemized receipts are required. Please allow two weeks for processing.
          </Callout>
          <SubmitButton>Submit</SubmitButton>
        </ValidatedForm>
      </PageContainer>
    </>
  );
}

export function ErrorBoundary() {
  return <ErrorComponent />;
}
