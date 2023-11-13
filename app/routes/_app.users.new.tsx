import { UserRole } from "@prisma/client";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import type { MetaFunction } from "@remix-run/react";
import { isRouteErrorResponse, useRouteError } from "@remix-run/react";
import { withZod } from "@remix-validated-form/with-zod";
import { redirect, typedjson, useTypedLoaderData } from "remix-typedjson";
import { ValidatedForm, validationError } from "remix-validated-form";
import { z } from "zod";

import { PageContainer } from "~/components/page-container";
import { PageHeader } from "~/components/page-header";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Select } from "~/components/ui/select";
import { SubmitButton } from "~/components/ui/submit-button";
import { prisma } from "~/utils/db.server";
import { requireUser } from "~/utils/session.server";

const validator = withZod(
  z
    .object({
      firstName: z.string().min(1, { message: "First name is required" }),
      lastName: z.string().optional(),
      email: z.string().email({ message: "Invalid email address" }),
      role: z.nativeEnum(UserRole),
      accountId: z.string().optional(),
    })
    .refine((schema) => schema.role === "USER" && schema.accountId, {
      message: "Users must be assigned to an account",
      path: ["accountId"],
    }),
);

export const meta: MetaFunction = () => [{ title: "New User • Alliance 436" }];

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await requireUser(request, ["OWNER", "SUPERADMIN"]);
  return typedjson({ accounts: await prisma.account.findMany() });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  await requireUser(request, ["SUPERADMIN"]);
  const result = await validator.validate(await request.formData());
  if (result.error) return validationError(result.error);

  const user = await prisma.user.create({ data: result.data });
  return redirect(`/users/${user.id}`);
};

export default function NewUserPage() {
  const { accounts } = useTypedLoaderData<typeof loader>();

  return (
    <>
      <PageHeader title="New User" />
      <PageContainer>
        <ValidatedForm id="userForm" validator={validator} method="post" className="space-y-4 sm:max-w-md">
          <Input label="First name" id="firstName" name="firstName" required />
          <Input label="Last name" id="lastName" name="lastName" />
          <Input label="Email" id="email" name="email" />
          <Select
            name="role"
            label="Role"
            placeholder="Select a role"
            options={Object.entries(UserRole).map(([key, value]) => ({
              value: key,
              label: value,
            }))}
          />
          <Select name="accountId" label="Account" placeholder="Select an account" options={accounts.map((c) => ({ value: c.id, label: c.name }))} />
          <div className="flex items-center gap-2">
            <SubmitButton>Create</SubmitButton>
            <Button type="reset" variant="outline">
              Reset
            </Button>
          </div>
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
