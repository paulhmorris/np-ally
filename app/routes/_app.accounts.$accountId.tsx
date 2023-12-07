import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { Link, type MetaFunction } from "@remix-run/react";
import { withZod } from "@remix-validated-form/with-zod";
import { IconWorld } from "@tabler/icons-react";
import dayjs from "dayjs";
import { useState } from "react";
import { typedjson, useTypedLoaderData } from "remix-typedjson";
import { ValidatedForm, setFormDefaults, validationError } from "remix-validated-form";
import invariant from "tiny-invariant";
import { z } from "zod";

import { ErrorComponent } from "~/components/error-component";
import { ConfirmDestructiveModal } from "~/components/modals/confirm-destructive-modal";
import { PageContainer } from "~/components/page-container";
import { PageHeader } from "~/components/page-header";
import { Button } from "~/components/ui/button";
import { ButtonGroup } from "~/components/ui/button-group";
import { FormField } from "~/components/ui/form";
import { SubmitButton } from "~/components/ui/submit-button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table";
import { prisma } from "~/integrations/prisma.server";
import { notFound } from "~/lib/responses.server";
import { requireUser } from "~/lib/session.server";
import { toast } from "~/lib/toast.server";
import { formatCurrency, useUser } from "~/lib/utils";

const validator = withZod(
  z.object({
    code: z.string().min(1, { message: "Code is required" }),
    description: z.string().min(1, { message: "Description is required" }),
    _action: z.enum(["delete", "update"]),
  }),
);

export const loader = async ({ params, request }: LoaderFunctionArgs) => {
  await requireUser(request, ["SUPERADMIN"]);
  invariant(params.accountId, "accountId not found");

  const account = await prisma.account.findUnique({
    where: { id: params.accountId },
    include: {
      organization: true,
      transactions: {
        take: 5,
        orderBy: { date: "desc" },
        include: {
          transactionItems: {
            include: {
              contact: true,
              method: true,
              type: true,
            },
          },
        },
      },
      user: {
        include: {
          contact: true,
        },
      },
    },
  });
  if (!account) throw notFound({ message: "Account not found" });

  return typedjson({
    account,
    ...setFormDefaults("account-form", { ...account }),
  });
};

export const meta: MetaFunction = () => [{ title: "User • Alliance 436" }];

export const action = async ({ params, request }: ActionFunctionArgs) => {
  await requireUser(request, ["ADMIN", "SUPERADMIN"]);
  const result = await validator.validate(await request.formData());
  if (result.error) return validationError(result.error);

  const { _action, ...rest } = result.data;

  const account = await prisma.account.findUnique({
    where: { id: params.accountId },
  });

  if (!account) throw notFound({ message: "Account not found" });

  if (_action === "delete") {
    await prisma.account.delete({ where: { id: params.accountId } });
    return redirect("/accounts");
  }

  const updatedAccount = await prisma.account.update({
    where: { id: params.accountId },
    data: { ...rest },
  });

  return toast.json(
    request,
    { updatedAccount },
    { variant: "default", title: "Account updated", description: "Great job." },
  );
};

export default function UserDetailsPage() {
  const sessionUser = useUser();
  const { account } = useTypedLoaderData<typeof loader>();
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <PageHeader title={account.code} description={account.id}>
        <div className="flex items-center gap-2">
          {sessionUser.id !== account.id && sessionUser.role === "SUPERADMIN" ? (
            <ConfirmDestructiveModal
              open={modalOpen}
              onOpenChange={setModalOpen}
              description="This action cannot be undone. This will permanently delete the
                  account and remove the data from the server."
            />
          ) : null}
        </div>
      </PageHeader>
      {account.organization ? (
        <p className="mt-2 flex items-center gap-1 text-sm text-muted-foreground">
          <IconWorld className="h-4 w-4" />
          {account.organization.name}
        </p>
      ) : null}

      <PageContainer>
        <ValidatedForm id="account-form" validator={validator} method="post" className="space-y-4 sm:max-w-md">
          <FormField label="Code" id="name" name="code" required />
          <FormField label="Description" id="name" name="description" required />

          <ButtonGroup>
            <SubmitButton className="w-full" name="_action" value="update">
              Save Account
            </SubmitButton>
            <Button type="reset" variant="outline">
              Reset
            </Button>
          </ButtonGroup>
        </ValidatedForm>

        <div className="mt-12 space-y-2">
          <h2 className="text-xl font-bold">Recent Transactions</h2>
          <div>
            {account.transactions.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Donor</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {account.transactions.map((t) => {
                    return (
                      <TableRow key={t.id}>
                        <TableCell>{dayjs(t.date).format("MM/DD/YYYY")}</TableCell>
                        <TableCell>{formatCurrency(t.amountInCents / 100, 2)}</TableCell>
                        <TableCell className="truncate">{t.description}</TableCell>
                        <TableCell className="truncate">
                          {/* {t.transactionItems.find((ti) => ti.contact)} */}
                        </TableCell>
                        <TableCell>
                          <Button asChild variant="link">
                            <Link to={`/transactions/${t.id}`}>View</Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            ) : null}
          </div>
        </div>
      </PageContainer>
    </>
  );
}

export function ErrorBoundary() {
  return <ErrorComponent />;
}
