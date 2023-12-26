import { UserRole } from "@prisma/client";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import type { MetaFunction } from "@remix-run/react";
import { Link, useFetcher } from "@remix-run/react";
import { withZod } from "@remix-validated-form/with-zod";
import { useState } from "react";
import { typedjson, useTypedLoaderData } from "remix-typedjson";
import { ValidatedForm, setFormDefaults, validationError } from "remix-validated-form";
import invariant from "tiny-invariant";
import { z } from "zod";

import { ErrorComponent } from "~/components/error-component";
import { ConfirmDestructiveModal } from "~/components/modals/confirm-destructive-modal";
import { PageContainer } from "~/components/page-container";
import { PageHeader } from "~/components/page-header";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { ButtonGroup } from "~/components/ui/button-group";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { FormField } from "~/components/ui/form";
import { SubmitButton } from "~/components/ui/submit-button";
import { prisma } from "~/integrations/prisma.server";
import { forbidden, notFound } from "~/lib/responses.server";
import { requireUser } from "~/lib/session.server";
import { toast } from "~/lib/toast.server";
import { useUser } from "~/lib/utils";

const validator = withZod(
  z.object({
    id: z.string().cuid(),
    firstName: z.string().min(1, { message: "First name is required" }),
    lastName: z.string().min(1, { message: "Last name is required" }),
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
    ...setFormDefaults("user-form", { ...authorizedUser, ...authorizedUser.contact }),
  });
};

export const meta: MetaFunction = () => [{ title: "User • Alliance 436" }];

export const action = async ({ request }: ActionFunctionArgs) => {
  const authorizedUser = await requireUser(request);

  const result = await validator.validate(await request.formData());
  if (result.error) {
    return validationError(result.error);
  }

  const { data } = result;

  if (authorizedUser.role === UserRole.USER && authorizedUser.id !== data.id) {
    throw forbidden({ message: "You do not have permission to edit this user." });
  }

  const updatedUser = await prisma.user.update({
    where: { id: data.id },
    data: {
      contact: {
        update: {
          ...data,
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
  const [modalOpen, setModalOpen] = useState(false);
  const fetcher = useFetcher();

  return (
    <>
      <PageHeader
        title={`${user.contact.firstName}${user.contact.lastName ? " " + user.contact.lastName : ""}`}
        description={
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="capitalize">
              Contact: {user.contact.type.name.toLowerCase()}
            </Badge>
            <Badge variant="outline" className="capitalize">
              Role: {user.role.toLowerCase()}
            </Badge>
          </div>
        }
      >
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
          {authorizedUser.id !== user.id && authorizedUser.role === "SUPERADMIN" ? (
            <ConfirmDestructiveModal
              open={modalOpen}
              onOpenChange={setModalOpen}
              description="This action cannot be undone. This will permanently delete the
                  user and remove the data from the server."
            />
          ) : null}
        </div>
      </PageHeader>

      <PageContainer>
        <ValidatedForm id="user-form" validator={validator} method="post" className="space-y-4 sm:max-w-md">
          <input type="hidden" name="id" value={user.id} />
          <div className="flex gap-2">
            <FormField label="First name" id="firstName" name="firstName" required />
            <FormField label="Last name" id="lastName" name="lastName" required />
          </div>
          {/* <FormField label="Email" id="email" name="email" /> */}
          {/* <FormSelect
            name="role"
            label="Role"
            placeholder="Select a role"
            options={Object.entries(UserRole)
              .filter(([key]) => key !== "SUPERADMIN")
              .map(([key, value]) => ({
                value: key,
                label: value,
              }))}
          /> */}
          <ButtonGroup>
            <SubmitButton>Save</SubmitButton>
            <Button type="reset" variant="outline">
              Reset
            </Button>
          </ButtonGroup>
        </ValidatedForm>
        <div className="mt-4">
          {user.contactAssignments.length > 0 ? (
            <Card className="flex-1 basis-48 bg-white">
              <CardHeader>
                <CardTitle>Contact Assignments</CardTitle>
                <CardDescription>You will receive regular reminders to engage with these Contacts.</CardDescription>
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
