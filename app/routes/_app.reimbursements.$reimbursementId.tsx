import { Prisma, ReimbursementRequestStatus } from "@prisma/client";
import { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { MetaFunction } from "@remix-run/react";
import { withZod } from "@remix-validated-form/with-zod";
import { IconExternalLink } from "@tabler/icons-react";
import dayjs from "dayjs";
import { typedjson, useTypedLoaderData } from "remix-typedjson";
import { ValidatedForm, validationError } from "remix-validated-form";
import invariant from "tiny-invariant";
import { z } from "zod";

import { PageHeader } from "~/components/common/page-header";
import { PageContainer } from "~/components/page-container";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Callout } from "~/components/ui/callout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "~/components/ui/card";
import { FormField, FormSelect, FormTextarea } from "~/components/ui/form";
import { Separator } from "~/components/ui/separator";
import { db } from "~/integrations/prisma.server";
import { Sentry } from "~/integrations/sentry";
import { TransactionItemMethod, TransactionItemType } from "~/lib/constants";
import { getPrismaErrorText } from "~/lib/responses.server";
import { toast } from "~/lib/toast.server";
import { capitalize, formatCentsAsDollars } from "~/lib/utils";
import { CurrencySchema } from "~/models/schemas";
import { sendReimbursementRequestUpdateEmail } from "~/services.server/mail";
import { generateS3Urls } from "~/services.server/receipt";
import { SessionService } from "~/services.server/session";

export const meta: MetaFunction<typeof loader> = ({ data }) => [
  {
    title: data
      ? // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        `${capitalize(String(data.reimbursementRequest.status))} Request`
      : "Reimbursement Request",
  },
];

const validator = withZod(
  z.object({
    id: z.string().cuid(),
    accountId: z.string().optional(),
    amount: CurrencySchema,
    note: z.string().max(2000).optional(),
    _action: z.nativeEnum(ReimbursementRequestStatus),
  }),
);

export async function loader({ request, params }: LoaderFunctionArgs) {
  await SessionService.requireAdmin(request);
  const orgId = await SessionService.requireOrgId(request);

  invariant(params.reimbursementId, "reimbursementId not found");

  const rr = await db.reimbursementRequest.findUniqueOrThrow({
    where: { id: params.reimbursementId, orgId },
    select: {
      id: true,
      date: true,
      status: true,
      vendor: true,
      accountId: true,
      description: true,
      amountInCents: true,
      user: {
        select: {
          username: true,
          contact: {
            select: {
              email: true,
            },
          },
        },
      },
      account: {
        select: {
          id: true,
          code: true,
          description: true,
        },
      },
      receipts: {
        select: {
          id: true,
          s3Key: true,
          s3Url: true,
          s3UrlExpiry: true,
          title: true,
        },
      },
      method: {
        select: {
          name: true,
        },
      },
    },
  });

  rr.receipts = await generateS3Urls(rr.receipts);
  const accounts = await db.account.findMany({ where: { orgId }, orderBy: { code: "asc" } });

  return typedjson({ reimbursementRequest: rr, accounts });
}

export async function action({ request }: ActionFunctionArgs) {
  await SessionService.requireAdmin(request);
  const orgId = await SessionService.requireOrgId(request);

  const result = await validator.validate(await request.formData());

  if (result.error) {
    return validationError(result.error);
  }

  const { _action, amount, accountId, note, id } = result.data;

  // Reopen
  if (_action === ReimbursementRequestStatus.PENDING) {
    const rr = await db.reimbursementRequest.update({
      where: { id, orgId },
      data: { status: ReimbursementRequestStatus.PENDING },
      select: {
        user: {
          select: {
            username: true,
          },
        },
      },
    });
    await sendReimbursementRequestUpdateEmail({
      email: rr.user.username,
      status: _action,
      orgId,
      note,
    });
    return toast.json(
      request,
      { reimbursementRequest: rr },
      {
        type: "info",
        title: "The reimbursement request has been reopened and the requester will be notified.",
        description: "",
      },
    );
  }

  // Approved
  if (_action === ReimbursementRequestStatus.APPROVED) {
    if (!accountId) {
      return validationError({
        fieldErrors: {
          accountId: "Account is required for approvals.",
        },
      });
    }

    try {
      const rr = await db.reimbursementRequest.findUniqueOrThrow({
        where: { id, orgId },
        select: {
          accountId: true,
          user: {
            select: {
              username: true,
            },
          },
        },
      });

      // Verify the account has enough funds
      const account = await db.account.findUnique({
        where: { id: accountId, orgId },
        select: {
          code: true,
          transactions: {
            select: {
              amountInCents: true,
            },
          },
        },
      });

      if (!account) {
        return validationError({
          fieldErrors: {
            accountId: "Account not found.",
          },
        });
      }

      const balance = account.transactions.reduce((acc, t) => acc + t.amountInCents, 0);
      if (balance < amount) {
        return toast.json(
          request,
          { message: "Insufficient Funds" },
          {
            type: "warning",
            title: "Insufficient Funds",
            description: `The reimbursement request couldn't be completed because account ${
              account.code
            } has a balance of ${formatCentsAsDollars(balance)}.`,
          },
        );
      }

      await db.$transaction([
        db.transaction.create({
          data: {
            orgId,
            accountId,
            amountInCents: amount * -1,
            description: note || "Approved reimbursement request",
            date: new Date(),
            transactionItems: {
              create: {
                orgId,
                amountInCents: amount * -1,
                methodId: TransactionItemMethod.Other,
                typeId: TransactionItemType.Other_Outgoing,
              },
            },
          },
        }),
        db.reimbursementRequest.update({
          where: { id, orgId },
          data: { status: _action },
          include: { account: true },
        }),
      ]);

      await sendReimbursementRequestUpdateEmail({
        email: rr.user.username,
        status: ReimbursementRequestStatus.APPROVED,
        orgId,
        note,
      });

      return toast.json(
        request,
        { reimbursementRequest: rr },
        {
          type: "success",
          title: "Reimbursement Request Approved",
          description: `The reimbursement request has been approved and account ${account.code} has been adjusted.`,
        },
      );
    } catch (error) {
      Sentry.captureException(error);
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        return toast.json(
          request,
          { message: getPrismaErrorText(error) },
          { type: "error", title: "Database Error", description: getPrismaErrorText(error) },
        );
      }
      return toast.json(
        request,
        { message: "An unknown error occurred" },
        {
          type: "error",
          title: "An unknown error occurred",
          description: error instanceof Error ? error.message : "",
        },
      );
    }
  }

  // Rejected or Voided
  const rr = await db.reimbursementRequest.update({
    where: { id, orgId },
    data: { status: _action },
    include: { user: true },
  });
  await sendReimbursementRequestUpdateEmail({
    email: rr.user.username,
    status: _action,
    orgId,
    note,
  });
  const normalizedAction = _action === ReimbursementRequestStatus.REJECTED ? "rejected" : "voided";
  return toast.json(
    request,
    { reimbursementRequest: rr },
    {
      type: "success",
      title: `Reimbursement request ${normalizedAction}`,
      description: `The reimbursement request has been ${normalizedAction} and the requester will be notified.`,
    },
  );
  // TODO: Send email to requester
}

export default function ReimbursementRequestPage() {
  const { reimbursementRequest: rr, accounts } = useTypedLoaderData<typeof loader>();

  return (
    <>
      <PageHeader title="Reimbursement Request" />
      <PageContainer className="sm:max-w-xl">
        <Card>
          <CardHeader>
            <CardTitle>New Request</CardTitle>
            <CardDescription>
              {rr.account.code}
              {rr.account.description ? ` - ${rr.account.description}` : null}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 items-center gap-2 text-sm">
              <dt className="font-semibold capitalize">Status</dt>
              <dd className="col-span-2">
                <Badge
                  variant={
                    rr.status === "APPROVED"
                      ? "success"
                      : rr.status === "REJECTED"
                        ? "destructive"
                        : rr.status === "VOID"
                          ? "outline"
                          : "secondary"
                  }
                >
                  {rr.status}
                </Badge>
              </dd>
              <dt className="font-semibold capitalize">Submitted By</dt>
              <dd className="col-span-2 text-muted-foreground">{rr.user.username}</dd>

              <dt className="font-semibold capitalize">Submitted On</dt>
              <dd className="col-span-2 text-muted-foreground">{dayjs(rr.date).format("M/D/YYYY h:mm a")}</dd>

              <dt className="font-semibold capitalize">Amount</dt>
              <dd className="col-span-2 text-muted-foreground">{formatCentsAsDollars(rr.amountInCents)}</dd>

              <dt className="font-semibold capitalize">Method</dt>
              <dd className="col-span-2 text-muted-foreground">{rr.method.name}</dd>

              {rr.vendor ? (
                <>
                  <dt className="font-semibold capitalize">Vendor</dt>
                  <dd className="col-span-2 text-muted-foreground">{rr.vendor}</dd>
                </>
              ) : null}

              {rr.description ? (
                <>
                  <dt className="font-semibold capitalize">Notes</dt>
                  <dd className="col-span-2 text-muted-foreground">{rr.description}</dd>
                </>
              ) : null}

              <dt className="self-start font-semibold capitalize">Receipts</dt>
              <dd className="col-span-2 text-muted-foreground">
                {rr.receipts.length > 0 ? (
                  rr.receipts.map((receipt) => {
                    if (!receipt.s3Url) {
                      return (
                        <span key={receipt.id} className="text-muted-foregrounded-none block">
                          {receipt.title} (Link missing or broken - try refreshing)
                        </span>
                      );
                    }

                    return (
                      <a
                        key={receipt.id}
                        href={receipt.s3Url}
                        className="flex items-center gap-1.5 font-medium text-primary"
                        target="_blank"
                        rel="noreferrer"
                      >
                        <span className="truncate">{receipt.title}</span>
                        <IconExternalLink className="size-3.5 shrink-0" aria-hidden="true" />
                      </a>
                    );
                  })
                ) : (
                  <span className="text-muted-foreground">None</span>
                )}
              </dd>
            </div>
          </CardContent>

          <CardFooter>
            <ValidatedForm
              id="reimbursement-request"
              method="post"
              validator={validator}
              className="flex w-full"
              defaultValues={{ accountId: rr.accountId, amount: rr.amountInCents / 100.0 }}
            >
              <input type="hidden" name="id" value={rr.id} />
              {rr.status === ReimbursementRequestStatus.PENDING ? (
                <fieldset>
                  <legend>
                    <Callout>
                      <span>Approving this will deduct from the below account for the amount specified.</span>
                    </Callout>
                  </legend>
                  <div className="mt-4 space-y-4">
                    <FormField name="amount" label="Amount" isCurrency required />
                    <FormSelect
                      name="accountId"
                      label="Account to deduct from"
                      placeholder="Select account"
                      description="Required for approvals"
                      options={accounts.map((a) => ({
                        value: a.id,
                        label: `${a.code} - ${a.description}`,
                      }))}
                    />
                    <FormTextarea
                      label="Public note"
                      name="note"
                      maxLength={2000}
                      description="This note will appear on the the transaction and/or be sent to the requester."
                    />
                    <Separator />
                    <div className="flex w-full flex-col gap-2 sm:flex-row-reverse sm:items-center">
                      <Button
                        name="_action"
                        value={ReimbursementRequestStatus.APPROVED}
                        className="mb-24 sm:mb-0 md:ml-auto"
                      >
                        Approve
                      </Button>
                      <Button variant="outline" name="_action" value={ReimbursementRequestStatus.VOID}>
                        Void
                      </Button>
                      <Button variant="destructive" name="_action" value={ReimbursementRequestStatus.REJECTED}>
                        Reject
                      </Button>
                    </div>
                  </div>
                </fieldset>
              ) : (
                <>
                  <input type="hidden" name="amount" value={rr.amountInCents} />
                  <Button
                    name="_action"
                    value={ReimbursementRequestStatus.PENDING}
                    variant="outline"
                    className="ml-auto"
                  >
                    Reopen
                  </Button>
                </>
              )}
            </ValidatedForm>
          </CardFooter>
        </Card>
      </PageContainer>
    </>
  );
}
