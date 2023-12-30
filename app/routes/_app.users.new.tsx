import { UserRole } from "@prisma/client";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import type { MetaFunction } from "@remix-run/react";
import { withZod } from "@remix-validated-form/with-zod";
import { redirect, typedjson, useTypedLoaderData } from "remix-typedjson";
import { ValidatedForm, validationError } from "remix-validated-form";
import { z } from "zod";

import { ErrorComponent } from "~/components/error-component";
import { PageContainer } from "~/components/page-container";
import { PageHeader } from "~/components/page-header";
import { Button } from "~/components/ui/button";
import { FormField, FormSelect } from "~/components/ui/form";
import { SelectItem } from "~/components/ui/select";
import { SubmitButton } from "~/components/ui/submit-button";
import { prisma } from "~/integrations/prisma.server";
import { ContactType } from "~/lib/constants";
import { requireUser } from "~/lib/session.server";
import { toast } from "~/lib/toast.server";
import { useUser } from "~/lib/utils";
import { sendPasswordSetupEmail } from "~/models/mail.server";
import { generatePasswordReset } from "~/models/password_reset.server";

const validator = withZod(
  z.object({
    firstName: z.string().min(1, { message: "First name is required" }),
    lastName: z.string().optional(),
    username: z.string().email({ message: "Invalid email address" }),
    role: z.nativeEnum(UserRole),
    typeId: z.coerce.number().pipe(z.nativeEnum(ContactType)),
  }),
);

export const meta: MetaFunction = () => [{ title: "New User • Alliance 436" }];

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await requireUser(request, ["ADMIN", "SUPERADMIN"]);
  return typedjson({
    accounts: await prisma.account.findMany(),
    contactTypes: await prisma.contactType.findMany(),
  });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const authorizedUser = await requireUser(request, ["ADMIN", "SUPERADMIN"]);
  const result = await validator.validate(await request.formData());
  if (result.error) {
    return validationError(result.error);
  }

  const { role, username, ...contact } = result.data;

  if (authorizedUser.role !== UserRole.SUPERADMIN && role === UserRole.SUPERADMIN) {
    return toast.json(
      request,
      { message: "You do not have permission to create a Super Admin" },
      {
        variant: "warning",
        title: "Permission denied",
        description: "You do not have permission to create a Super Admin",
      },
      { status: 403 },
    );
  }

  const user = await prisma.user.create({
    data: {
      role,
      username,
      contact: {
        create: {
          email: username,
          ...contact,
        },
      },
    },
  });

  const { token } = await generatePasswordReset({ username: user.username });
  await sendPasswordSetupEmail({ email: user.username, token });
  return redirect(`/users/${user.id}`);
};

export default function NewUserPage() {
  const user = useUser();
  const { contactTypes } = useTypedLoaderData<typeof loader>();
  return (
    <>
      <PageHeader title="New User" />
      <PageContainer>
        <ValidatedForm id="userForm" validator={validator} method="post" className="space-y-4 sm:max-w-md">
          <FormField label="First name" id="firstName" name="firstName" required />
          <FormField label="Last name" id="lastName" name="lastName" />
          <FormField label="Username" id="username" name="username" />
          <FormSelect
            name="typeId"
            label="Type"
            placeholder="Select a type"
            options={contactTypes.map((type) => ({
              value: type.id,
              label: type.name,
            }))}
          />
          <FormSelect name="role" label="Role" placeholder="Select a role">
            <SelectItem value="USER">User</SelectItem>
            <SelectItem value="ADMIN">Admin</SelectItem>
            {user.role === UserRole.SUPERADMIN ? <SelectItem value="SUPERADMIN">Super Admin</SelectItem> : null}
          </FormSelect>
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
  return <ErrorComponent />;
}
