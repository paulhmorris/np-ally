import { UserRole } from "@prisma/client";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import type { MetaFunction } from "@remix-run/react";
import { Link, useFetcher } from "@remix-run/react";
import { withZod } from "@remix-validated-form/with-zod";
import { IconAddressBook, IconBuildingBank, IconKey, IconLockPlus, IconUserCircle } from "@tabler/icons-react";
import { typedjson, useTypedLoaderData } from "remix-typedjson";
import { ValidatedForm, setFormDefaults, validationError } from "remix-validated-form";
import invariant from "tiny-invariant";
import { z } from "zod";

import { ErrorComponent } from "~/components/error-component";
import { PageContainer } from "~/components/page-container";
import { PageHeader } from "~/components/page-header";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { ButtonGroup } from "~/components/ui/button-group";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { FormField, FormSelect } from "~/components/ui/form";
import { SelectItem } from "~/components/ui/select";
import { SubmitButton } from "~/components/ui/submit-button";
import { prisma } from "~/integrations/prisma.server";
import { forbidden, notFound } from "~/lib/responses.server";
import { toast } from "~/lib/toast.server";
import { useUser } from "~/lib/utils";
import { SessionService } from "~/services/SessionService.server";

const validator = withZod(
  z.object({
    id: z.string().cuid(),
    firstName: z.string().min(1, { message: "First name is required" }),
    lastName: z.string().min(1, { message: "Last name is required" }),
    username: z.string().email({ message: "Invalid email address" }).optional(),
    role: z.nativeEnum(UserRole),
    accountId: z.string().optional(),
  }),
);

const passwordResetValidator = withZod(
  z.object({
    username: z.string().email({ message: "Invalid email address" }),
  }),
);

export const loader = async ({ params, request }: LoaderFunctionArgs) => {
  const authorizedUser = await SessionService.requireUser(request);
  invariant(params.userId, "userId not found");

  if (authorizedUser.role === UserRole.USER && authorizedUser.id !== params.userId) {
    throw forbidden({ message: "You do not have permission to view this page" });
  }

  const accounts = await prisma.account.findMany({
    where: {
      OR: [{ user: null }, { user: { id: params.userId } }],
    },
  });

  const userWithPassword = await prisma.user.findUnique({
    where: { id: params.userId },
    include: {
      contactAssignments: {
        include: {
          contact: true,
        },
      },
      password: true,
      account: {
        select: {
          id: true,
          code: true,
          description: true,
        },
      },
      contact: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          type: {
            select: {
              name: true,
            },
          },
        },
      },
    },
  });
  if (!userWithPassword) throw notFound({ message: "User not found" });

  const { password: _password, ...userWithoutPassword } = userWithPassword;

  return typedjson({
    accounts,
    user: userWithoutPassword,
    hasPassword: !!_password,
    ...setFormDefaults("user-form", {
      ...userWithPassword,
      ...userWithPassword.contact,
      accountId: userWithPassword.account?.id,
    }),
  });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const authorizedUser = await SessionService.requireUser(request);

  const result = await validator.validate(await request.formData());
  if (result.error) {
    return validationError(result.error);
  }

  const { username, role, id, accountId, ...contact } = result.data;

  const userToBeUpdated = await prisma.user.findUnique({ where: { id } });
  if (!userToBeUpdated) {
    throw notFound({ message: "User not found" });
  }

  if (authorizedUser.role === UserRole.USER) {
    // Users can only edit themselves
    if (authorizedUser.id !== id) {
      return toast.json(
        request,
        { message: "You do not have permission to edit this user." },
        {
          type: "warning",
          title: "Permission denied",
          description: "You do not have permission to edit this user.",
        },
        { status: 403 },
      );
    }

    // Users can't edit their role, username, or assigned account
    if (
      role !== userToBeUpdated.role ||
      username !== userToBeUpdated.username ||
      accountId !== userToBeUpdated.accountId
    ) {
      return toast.json(
        request,
        { message: "You do not have permission to edit this field." },
        {
          type: "warning",
          title: "Permission denied",
          description: "You do not have permission to edit this field.",
        },
        { status: 403 },
      );
    }
  }

  if (authorizedUser.role !== UserRole.SUPERADMIN && role === UserRole.SUPERADMIN) {
    return toast.json(
      request,
      { message: "You do not have permission to create a Super Admin." },
      {
        type: "warning",
        title: "Permission denied",
        description: "You do not have permission to create a Super Admin.",
      },
      { status: 403 },
    );
  }

  const updatedUser = await prisma.user.update({
    where: { id },
    data: {
      role,
      username,
      account: accountId ? { connect: { id: accountId } } : { disconnect: true },
      contact: {
        update: {
          ...contact,
        },
      },
    },
  });

  return toast.json(
    request,
    { user: updatedUser },
    { type: "success", title: "User updated", description: "Great job." },
  );
};

export const meta: MetaFunction<typeof loader> = ({ data }) => [
  {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    title: `User ${data?.user.contact.firstName}${
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      data?.user.contact.lastName ? " " + data?.user.contact.lastName : ""
    } | Alliance 436`,
  },
];

export default function UserDetailsPage() {
  const authorizedUser = useUser();
  const { user, hasPassword, accounts } = useTypedLoaderData<typeof loader>();
  const fetcher = useFetcher();

  const isYou = authorizedUser.id === user.id;

  return (
    <>
      <PageHeader title={`${user.contact.firstName}${user.contact.lastName ? " " + user.contact.lastName : ""}`}>
        <div className="flex items-center gap-2">
          <ValidatedForm
            id="reset-password-form"
            fetcher={fetcher}
            validator={passwordResetValidator}
            method="post"
            action="/resources/reset-password"
          >
            <input type="hidden" name="username" value={user.username} />
            <SubmitButton variant="outline" type="submit" formId="reset-password-form">
              <span>Send Password {hasPassword ? "Reset" : "Setup"}</span>
              {!hasPassword ? <IconLockPlus className="size-4" /> : null}
            </SubmitButton>
          </ValidatedForm>
        </div>
      </PageHeader>
      <div className="mt-4 flex flex-wrap items-center gap-2 sm:mt-1">
        <Badge variant="outline" className="capitalize">
          <div>
            <IconAddressBook className="size-3" />
          </div>
          <span>{user.contact.type.name.toLowerCase()}</span>
        </Badge>
        <Badge variant="outline" className="capitalize">
          <div>
            <IconKey className="size-3" />
          </div>
          <span>{user.role.toLowerCase()}</span>
        </Badge>
        <Badge variant="secondary" className="capitalize">
          <Link to={`/contacts/${user.contact.id}`} className="flex items-center gap-2">
            <div>
              <IconUserCircle className="size-3" />
            </div>
            <span>
              {user.contact.firstName} {user.contact.lastName}
            </span>
          </Link>
        </Badge>
        {user.account ? (
          <Badge variant="secondary">
            <Link to={`/accounts/${user.account.id}`} className="flex items-center gap-2">
              <div>
                <IconBuildingBank className="size-3" />
              </div>
              {`${user.account.code} - ${user.account.description}`}
            </Link>
          </Badge>
        ) : null}
      </div>

      <PageContainer>
        <ValidatedForm id="user-form" validator={validator} method="post" className="sm:max-w-md">
          <div className="space-y-4">
            <div className="flex gap-2">
              <FormField label="First name" id="firstName" name="firstName" required />
              <FormField label="Last name" id="lastName" name="lastName" required />
            </div>
            <input type="hidden" name="id" value={user.id} />
            {authorizedUser.role === UserRole.SUPERADMIN || authorizedUser.role === UserRole.ADMIN ? (
              <>
                <FormField label="Username" id="username" name="username" disabled />
                <FormSelect
                  required
                  disabled={isYou}
                  description={isYou ? "You cannot edit your own role." : ""}
                  name="role"
                  label="Role"
                  placeholder="Select a role"
                >
                  <SelectItem value="USER">User</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                  {authorizedUser.role === UserRole.SUPERADMIN ? (
                    <SelectItem value="SUPERADMIN">Super Admin</SelectItem>
                  ) : null}
                </FormSelect>
              </>
            ) : (
              <>
                <input type="hidden" name="username" value={user.username} />
                <input type="hidden" name="role" value={user.role} />
              </>
            )}
            {authorizedUser.role !== UserRole.USER ? (
              <FormSelect
                name="accountId"
                label="Linked Account"
                placeholder="Select an account"
                defaultValue={user.account?.id}
                description="Link this user to an account. They will be able to see this account and all related transactions."
                options={accounts.map((a) => ({ label: `${a.code} - ${a.description}`, value: a.id }))}
              />
            ) : (
              <input type="hidden" name="accountId" value={user.account?.id} />
            )}
            <ButtonGroup>
              <SubmitButton>Save</SubmitButton>
              <Button type="reset" variant="outline">
                Reset
              </Button>
            </ButtonGroup>
          </div>
        </ValidatedForm>
        <div className="mt-4 max-w-lg">
          {user.contactAssignments.length > 0 ? (
            <Card className="flex-1 basis-48 bg-transparent">
              <CardHeader>
                <CardTitle>Contact Assignments</CardTitle>
                <CardDescription>
                  {isYou ? "You" : "This user"} will receive regular reminders to engage with these Contacts.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul>
                  {user.contactAssignments.map((a) => (
                    <li key={a.id}>
                      <Link to={`/contacts/${a.contactId}`} className="text-sm font-medium text-primary">
                        {a.contact.firstName} {a.contact.lastName}
                      </Link>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ) : null}
        </div>
      </PageContainer>
    </>
  );
}

export function ErrorBoundary() {
  return <ErrorComponent />;
}
