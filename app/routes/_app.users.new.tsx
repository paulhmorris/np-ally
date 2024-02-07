import { UserRole } from "@prisma/client";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import type { MetaFunction } from "@remix-run/react";
import { withZod } from "@remix-validated-form/with-zod";
import { typedjson, useTypedLoaderData } from "remix-typedjson";
import { ValidatedForm, validationError } from "remix-validated-form";
import { z } from "zod";

import { ErrorComponent } from "~/components/error-component";
import { PageContainer } from "~/components/page-container";
import { PageHeader } from "~/components/page-header";
import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import { FormField, FormSelect } from "~/components/ui/form";
import { Label } from "~/components/ui/label";
import { SelectItem } from "~/components/ui/select";
import { SubmitButton } from "~/components/ui/submit-button";
import { prisma } from "~/integrations/prisma.server";
import { ContactType } from "~/lib/constants";
import { toast } from "~/lib/toast.server";
import { useUser } from "~/lib/utils";
import { CheckboxSchema } from "~/models/schemas";
import { MailService } from "~/services/MailService.server";
import { PasswordService } from "~/services/PasswordService.server";
import { SessionService } from "~/services/SessionService.server";

const validator = withZod(
  z.object({
    firstName: z.string().min(1, { message: "First name is required" }),
    lastName: z.string().optional(),
    username: z.string().email({ message: "Invalid email address" }),
    role: z.nativeEnum(UserRole),
    typeId: z.coerce.number().pipe(z.nativeEnum(ContactType)),
    sendPasswordSetup: CheckboxSchema,
    accountId: z.string().optional(),
  }),
);

export const meta: MetaFunction = () => [{ title: "New User | Alliance 436" }];

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await SessionService.requireAdmin(request);
  return typedjson({
    accounts: await prisma.account.findMany({
      where: {
        user: null,
      },
    }),
    contactTypes: await prisma.contactType.findMany(),
  });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const authorizedUser = await SessionService.requireAdmin(request);
  const result = await validator.validate(await request.formData());
  if (result.error) {
    return validationError(result.error);
  }

  const { role, username, sendPasswordSetup, accountId, ...contact } = result.data;

  if (authorizedUser.role !== UserRole.SUPERADMIN && role === UserRole.SUPERADMIN) {
    return toast.json(
      request,
      { message: "You do not have permission to create a Super Admin" },
      {
        type: "warning",
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
      account: {
        connect: accountId ? { id: accountId } : undefined,
      },
      contact: {
        create: {
          email: username,
          ...contact,
        },
      },
    },
  });

  if (sendPasswordSetup) {
    const { token } = await PasswordService.generatePasswordReset(user.username);
    await MailService.sendPasswordSetupEmail({ email: user.username, token });
  }

  return toast.redirect(request, `/users/${user.id}`, {
    type: "success",
    title: "User created",
    description: sendPasswordSetup
      ? "They will receive an email with instructions to set their password."
      : "You can use the password setup button to send them an email to set their password.",
  });
};

export default function NewUserPage() {
  const user = useUser();
  const { contactTypes, accounts } = useTypedLoaderData<typeof loader>();
  return (
    <>
      <PageHeader
        title="New User"
        description="Users can log in to this portal, request reimbursements, view transactions for a linked account, and view assigned contacts."
      />
      <PageContainer>
        <ValidatedForm id="userForm" validator={validator} method="post" className="space-y-4 sm:max-w-md">
          <FormField label="First name" id="firstName" name="firstName" placeholder="Sally" required />
          <FormField label="Last name" id="lastName" name="lastName" placeholder="Jones" />
          <FormField required label="Username" id="username" name="username" placeholder="sally@alliance436.org" />
          <FormSelect
            required
            name="typeId"
            label="Contact Type"
            placeholder="Select a type"
            options={contactTypes.map((type) => ({
              value: type.id,
              label: type.name,
            }))}
          />
          <FormSelect required name="role" label="Role" placeholder="Select a role">
            <SelectItem value="USER">User</SelectItem>
            <SelectItem value="ADMIN">Admin</SelectItem>
            {user.role === UserRole.SUPERADMIN ? <SelectItem value="SUPERADMIN">Super Admin</SelectItem> : null}
          </FormSelect>
          <FormSelect
            name="accountId"
            label="Linked Account"
            placeholder="Select an account"
            description="Link this user to an account. They will be able to see this account and all related transactions."
            options={accounts.map((a) => ({ label: `${a.code} - ${a.description}`, value: a.id }))}
          />
          <div>
            <div className="mb-1">
              <Label className="inline-flex cursor-pointer items-center gap-2">
                <Checkbox name="sendPasswordSetup" defaultChecked={false} aria-label="Send Password Setup" />
                <span>Send Password Setup</span>
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <SubmitButton>Create</SubmitButton>
              <Button type="reset" variant="outline">
                Reset
              </Button>
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
