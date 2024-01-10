import { ReimbursementRequestStatus } from "@prisma/client";
import { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { Link } from "@remix-run/react";
import { withZod } from "@remix-validated-form/with-zod";
import { IconExternalLink } from "@tabler/icons-react";
import dayjs from "dayjs";
import { typedjson, useTypedLoaderData } from "remix-typedjson";
import { ValidatedForm, validationError } from "remix-validated-form";
import invariant from "tiny-invariant";
import { z } from "zod";

import { PageContainer } from "~/components/page-container";
import { PageHeader } from "~/components/page-header";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Callout } from "~/components/ui/callout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "~/components/ui/card";
import { FormSelect, FormTextarea } from "~/components/ui/form";
import { Separator } from "~/components/ui/separator";
import { Bucket } from "~/integrations/bucket.server";
import { prisma } from "~/integrations/prisma.server";
import { TransactionItemMethod, TransactionItemType } from "~/lib/constants";
import { notFound } from "~/lib/responses.server";
import { toast } from "~/lib/toast.server";
import { formatCentsAsDollars } from "~/lib/utils";
import { SessionService } from "~/services/SessionService.server";

const validator = withZod(
  z.object({
    id: z.string().cuid(),
    accountId: z.string().optional(),
    note: z.string().max(2000).optional(),
    _action: z.nativeEnum(ReimbursementRequestStatus).or(z.literal("REOPEN")),
  }),
);

export async function loader({ request, params }: LoaderFunctionArgs) {
  await SessionService.requireAdmin(request);
  invariant(params.reimbursementId, "reimbursementId not found");

  const rr = await prisma.reimbursementRequest.findUnique({
    where: { id: params.reimbursementId },
    include: {
      user: { include: { contact: true } },
      account: true,
      receipts: true,
      method: true,
    },
  });

  if (!rr) {
    throw notFound("Reimbursement request not found");
  }

  // Get presigned URLs for all receipts and save them for a week
  if (
    rr.receipts.some((r) => !r.s3Url || (r.s3UrlExpiry && new Date(r.s3UrlExpiry).getTime() < new Date().getTime()))
  ) {
    const updatePromises = rr.receipts.map(async (receipt) => {
      if (!receipt.s3Url || (receipt.s3UrlExpiry && new Date(receipt.s3UrlExpiry).getTime() < new Date().getTime())) {
        console.info(`Generating url for ${receipt.title}`);
        const url = await Bucket.getGETPresignedUrl(receipt.s3Key);
        return prisma.receipt.update({
          where: { id: receipt.id },
          data: { s3Url: url, s3UrlExpiry: new Date(Date.now() + 6.5 * 24 * 60 * 60 * 1000) },
        });
      }
    });

    await Promise.all(updatePromises);
  }

  const accounts = await prisma.account.findMany({
    where: {
      id: {
        not: rr.accountId,
      },
    },
  });

  return typedjson({ reimbursementRequest: rr, accounts });
}

export async function action({ request }: ActionFunctionArgs) {
  await SessionService.requireAdmin(request);
  const result = await validator.validate(await request.formData());

  if (result.error) {
    return validationError(result.error);
  }

  const { _action, accountId, note, id } = result.data;

  // Reopen
  if (_action === "REOPEN") {
    const rr = await prisma.reimbursementRequest.update({
      where: { id },
      data: { status: ReimbursementRequestStatus.PENDING },
    });
    return toast.json(
      request,
      { reimbursementRequest: rr },
      { title: "Reimbursement Request reopened", description: "" },
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
    const rr = await prisma.reimbursementRequest.findUnique({
      where: { id },
      include: { account: true },
    });

    if (!rr) {
      return toast.json(
        request,
        { message: "Error" },
        {
          variant: "destructive",
          title: "Reimbursement request not found",
          description: `The reimbursement request you were trying to approve wasn't found. Support has been notified.`,
        },
      );
    }

    const total = rr.amountInCents;

    // Verify the account has enough funds
    const account = await prisma.account.findUnique({ where: { id: accountId }, include: { transactions: true } });
    if (!account) {
      return validationError({
        fieldErrors: {
          accountId: "Account not found.",
        },
      });
    }
    const balance = account.transactions.reduce((acc, t) => acc + t.amountInCents, 0);
    if (balance < total) {
      return toast.json(
        request,
        { message: "Insufficient Funds" },
        {
          variant: "warning",
          title: "Insufficient Funds",
          description: `The reimbursement request couldn't be completed because account ${
            account.code
          } has a balance of ${formatCentsAsDollars(balance)}.`,
        },
      );
    }

    await prisma.reimbursementRequest.update({
      where: { id },
      data: { status: _action },
      include: { account: true },
    });

    await prisma.$transaction([
      // Incoming transaction
      prisma.transaction.create({
        data: {
          accountId: rr.accountId,
          amountInCents: total,
          description: note,
          date: new Date(),
          transactionItems: {
            create: {
              amountInCents: total,
              methodId: TransactionItemMethod.Other,
              typeId: TransactionItemType.Other_Incoming,
            },
          },
        },
      }),
      // Outgoing transaction
      prisma.transaction.create({
        data: {
          account: {
            connect: { id: accountId },
          },
          amountInCents: -1 * total,
          description: `Reimbursement to account ${rr.account.code}`,
          date: new Date(),
          transactionItems: {
            create: {
              amountInCents: -1 * total,
              methodId: TransactionItemMethod.Other,
              typeId: TransactionItemType.Other_Outgoing,
            },
          },
        },
      }),
    ]);

    return toast.json(
      request,
      { reimbursementRequest: rr },
      {
        title: "Reimbursement Request Approved",
        description: "The reimbursement request has been approved and transactions have been created.",
      },
    );
  }

  // Rejected or Voided
  const rr = await prisma.reimbursementRequest.update({
    where: { id },
    data: { status: _action },
  });
  const normalizedAction = _action === ReimbursementRequestStatus.REJECTED ? "Rejected" : "Voided";
  return toast.json(
    request,
    { reimbursementRequest: rr },
    {
      title: `Reimbursement Request ${normalizedAction}`,
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
      <PageContainer className="sm:max-w-lg">
        <Card>
          <CardHeader>
            <CardTitle>New Request</CardTitle>
            <CardDescription>
              To: {rr.account.code}
              {rr.account.description ? ` - ${rr.account.description}` : null}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 items-start gap-2 text-sm">
              <dt className="font-semibold capitalize">Status</dt>
              <dd className="col-span-2">
                <Badge>{rr.status}</Badge>
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
                  <dt className="font-semibold capitalize">Notes</dt>
                  <dd className="col-span-2 text-muted-foreground">{rr.vendor}</dd>
                </>
              ) : null}

              {rr.description ? (
                <>
                  <dt className="font-semibold capitalize">Notes</dt>
                  <dd className="col-span-2 text-muted-foreground">{rr.description}</dd>
                </>
              ) : null}

              <dt className="font-semibold capitalize">Receipts</dt>
              <dd className="col-span-2 text-muted-foreground">
                {rr.receipts.length > 0 ? (
                  rr.receipts.map((receipt) => {
                    if (!receipt.s3Url) {
                      return (
                        <span key={receipt.id} className="text-muted-foreground">
                          {receipt.title} (Link missing or broken)
                        </span>
                      );
                    }

                    return (
                      <Link
                        key={receipt.id}
                        to={receipt.s3Url}
                        className="flex items-center gap-1.5 font-medium text-primary"
                        target="_blank"
                        rel="noreferrer"
                      >
                        <span>{receipt.title}</span>
                        <IconExternalLink className="size-3.5" />
                      </Link>
                    );
                  })
                ) : (
                  <span className="text-muted-foreground">None</span>
                )}
              </dd>
            </div>
          </CardContent>

          <CardFooter>
            <ValidatedForm method="post" validator={validator} className="mt-8 flex w-full">
              <input type="hidden" name="id" value={rr.id} />
              {rr.status === ReimbursementRequestStatus.PENDING ? (
                <fieldset>
                  <legend>
                    <Callout>
                      <span>
                        Approving this will create a transaction on the requesting account for the amount specified.
                      </span>
                    </Callout>
                  </legend>
                  <div className="mt-4 space-y-4">
                    <FormSelect
                      name="accountId"
                      label="Account to reimburse from"
                      placeholder="Select account"
                      description="Required for approvals"
                      options={accounts.map((a) => ({
                        value: a.id,
                        label: `${a.code} - ${a.description}`,
                      }))}
                    />
                    <FormTextarea
                      label="Note"
                      name="note"
                      maxLength={2000}
                      description="If approved, this note will appear on the transaction. If rejected, it will be sent to the requester."
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
                <Button name="_action" value="REOPEN" variant="outline" className="ml-auto">
                  Reopen
                </Button>
              )}
            </ValidatedForm>
          </CardFooter>
        </Card>
      </PageContainer>
    </>
  );
}
