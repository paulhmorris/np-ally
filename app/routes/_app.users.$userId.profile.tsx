import { MembershipRole, UserRole } from "@prisma/client";
import type { ActionFunctionArgs } from "@remix-run/node";
import { Link } from "@remix-run/react";
import { withZod } from "@remix-validated-form/with-zod";
import { useTypedRouteLoaderData } from "remix-typedjson";
import { ValidatedForm, validationError } from "remix-validated-form";
import { z } from "zod";

import { ErrorComponent } from "~/components/error-component";
import { Button } from "~/components/ui/button";
import { ButtonGroup } from "~/components/ui/button-group";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { FormField, FormSelect } from "~/components/ui/form";
import { SelectItem } from "~/components/ui/select";
import { SubmitButton } from "~/components/ui/submit-button";
import { useUser } from "~/hooks/useUser";
import { db } from "~/integrations/prisma.server";
import { notFound } from "~/lib/responses.server";
import { Toasts } from "~/lib/toast.server";
import { loader } from "~/routes/_app.users.$userId";
import { SessionService } from "~/services.server/session";

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

export const action = async ({ request }: ActionFunctionArgs) => {
  const authorizedUser = await SessionService.requireUser(request);
  const orgId = await SessionService.requireOrgId(request);

  const result = await validator.validate(await request.formData());
  if (result.error) {
    return validationError(result.error);
  }

  const { username, role, id, accountId, ...contact } = result.data;

  const userToBeUpdated = await db.user.findUnique({ where: { id } });
  if (!userToBeUpdated) {
    throw notFound({ message: "User not found" });
  }

  if (authorizedUser.isMember) {
    // Users can only edit themselves
    if (authorizedUser.id !== id) {
      return Toasts.jsonWithWarning(
        { message: "You do not have permission to edit this user." },
        { title: "Permission denied", description: "You do not have permission to edit this user." },
        { status: 403 },
      );
    }

    // Users can't edit their role, username, or assigned account
    if (
      role !== userToBeUpdated.role ||
      username !== userToBeUpdated.username ||
      accountId !== userToBeUpdated.accountId
    ) {
      return Toasts.jsonWithWarning(
        { message: "You do not have permission to edit this field." },
        { title: "Permission denied", description: "You do not have permission to edit this field." },
        { status: 403 },
      );
    }
  }

  if (authorizedUser.systemRole !== UserRole.SUPERADMIN && role === UserRole.SUPERADMIN) {
    return Toasts.jsonWithWarning(
      { message: "You do not have permission to create a Super Admin." },
      { title: "Permission denied", description: "You do not have permission to create a Super Admin." },
      { status: 403 },
    );
  }

  const updatedUser = await db.user.update({
    where: {
      id,
      memberships: {
        some: { orgId },
      },
    },
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

  return Toasts.jsonWithSuccess({ user: updatedUser }, { title: "User updated", description: "Great job." });
};

export default function UserDetailsPage() {
  const authorizedUser = useUser();
  const layoutData = useTypedRouteLoaderData<typeof loader>("routes/_app.users.$userId");

  if (!layoutData) {
    throw new Error("Missing layout data");
  }

  const { user, accounts } = layoutData;
  const isYou = authorizedUser.id === user.id;

  return (
    <>
      <ValidatedForm id="user-form" validator={validator} method="post" className="sm:max-w-md">
        <div className="space-y-4">
          <div className="flex gap-2">
            <FormField label="First name" id="firstName" name="firstName" required />
            <FormField label="Last name" id="lastName" name="lastName" required />
          </div>
          <input type="hidden" name="id" value={user.id} />
          {!authorizedUser.isMember ? (
            <>
              <FormField
                label="Username"
                id="username"
                name="username"
                disabled={authorizedUser.role === MembershipRole.MEMBER}
                required
              />
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
                {authorizedUser.isSuperAdmin ? <SelectItem value="SUPERADMIN">Super Admin</SelectItem> : null}
              </FormSelect>
            </>
          ) : (
            <>
              <input type="hidden" name="username" value={user.username} />
              <input type="hidden" name="role" value={user.role} />
            </>
          )}
          {!authorizedUser.isMember ? (
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
    </>
  );
}

export function ErrorBoundary() {
  return <ErrorComponent />;
}
