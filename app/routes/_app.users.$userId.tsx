import { UserRole } from "@prisma/client";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import type { MetaFunction } from "@remix-run/react";
import { Link, useFetcher } from "@remix-run/react";
import { withZod } from "@remix-validated-form/with-zod";
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
import { requireUser } from "~/lib/session.server";
import { toast } from "~/lib/toast.server";
import { useUser } from "~/lib/utils";

export const meta: MetaFunction = () => [{ title: "User • Alliance 436" }];

const validator = withZod(
  z.object({
    id: z.string().cuid(),
    firstName: z.string().min(1, { message: "First name is required" }),
    lastName: z.string().min(1, { message: "Last name is required" }),
    username: z.string().email({ message: "Invalid email address" }),
    role: z.nativeEnum(UserRole),
  }),
);

const passwordResetValidator = withZod(
  z.object({
    email: z.string().email({ message: "Invalid email address" }),
  }),
);

export const loader = async ({ params, request }: LoaderFunctionArgs) => {
  const authorizedUser = await requireUser(request);
  invariant(params.userId, "userId not found");

  if (authorizedUser.role === UserRole.USER && authorizedUser.id !== params.userId) {
    throw forbidden({ message: "You do not have permission to view this page" });
  }

  const user = await prisma.user.findUnique({
    where: { id: params.userId },
    include: {
      contactAssignments: {
        include: {
          contact: true,
        },
      },
      contact: {
        select: {
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
  if (!user) throw notFound({ message: "User not found" });

  return typedjson({
    user,
    ...setFormDefaults("user-form", { ...user, ...user.contact }),
  });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const authorizedUser = await requireUser(request);

  const result = await validator.validate(await request.formData());
  if (result.error) {
    return validationError(result.error);
  }

  const { username, role, id, ...contact } = result.data;

  if (authorizedUser.role === UserRole.USER && authorizedUser.id !== id) {
    throw forbidden({ message: "You do not have permission to edit this user." });
  }

  const userToBeUpdated = await prisma.user.findUnique({ where: { id } });

  if (!userToBeUpdated) {
    throw notFound({ message: "User not found" });
  }

  // Only super admins can edit roles and usernames
  if (authorizedUser.role !== UserRole.SUPERADMIN) {
    if (role !== userToBeUpdated.role || username !== userToBeUpdated.username) {
      throw forbidden({ message: "You do not have permission to edit this field." });
    }
  }

  const updatedUser = await prisma.user.update({
    where: { id },
    data: {
      role,
      username,
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
    { variant: "default", title: "User updated", description: "Great job." },
  );
};

export default function UserDetailsPage() {
  const authorizedUser = useUser();
  const { user } = useTypedLoaderData<typeof loader>();
  const fetcher = useFetcher();

  const isYou = authorizedUser.id === user.id;

  return (
    <>
      <PageHeader title={`${user.contact.firstName}${user.contact.lastName ? " " + user.contact.lastName : ""}`}>
        <div className="flex items-center gap-2">
          <ValidatedForm
            id="user-form"
            fetcher={fetcher}
            validator={passwordResetValidator}
            method="POST"
            action="/reset-password"
          >
            <input type="hidden" name="email" value={user.contact.email} />
            <SubmitButton variant="outline">Send Password Reset</SubmitButton>
          </ValidatedForm>
        </div>
      </PageHeader>
      <div className="mt-1 flex items-center gap-2">
        <Badge variant="outline" className="capitalize">
          Contact: {user.contact.type.name.toLowerCase()}
        </Badge>
        <Badge variant="outline" className="capitalize">
          Role: {user.role.toLowerCase()}
        </Badge>
      </div>

      <PageContainer>
        <ValidatedForm id="user-form" validator={validator} method="post" className="space-y-4 sm:max-w-md">
          <input type="hidden" name="id" value={user.id} />
          <div className="flex gap-2">
            <FormField label="First name" id="firstName" name="firstName" required />
            <FormField label="Last name" id="lastName" name="lastName" required />
          </div>
          {/* Super admin only */}
          {authorizedUser.role === UserRole.SUPERADMIN ? (
            <>
              <FormField label="Username" id="email" name="username" />
              <FormSelect
                disabled={isYou}
                description={isYou ? "You cannot edit your own role." : ""}
                name="role"
                label="Role"
                placeholder="Select a role"
                defaultValue={user.role}
              >
                <SelectItem value="USER">User</SelectItem>
                <SelectItem value="ADMIN">Admin</SelectItem>
                <SelectItem value="SUPERADMIN">Super Admin</SelectItem>
              </FormSelect>
            </>
          ) : null}
          <ButtonGroup>
            <SubmitButton>Save</SubmitButton>
            <Button type="reset" variant="outline">
              Reset
            </Button>
          </ButtonGroup>
        </ValidatedForm>
        <div className="mt-4">
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
