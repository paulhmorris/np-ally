import { UserRole } from "@prisma/client";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { Link, type MetaFunction } from "@remix-run/react";
import { withZod } from "@remix-validated-form/with-zod";
import { IconAddressBook, IconUser } from "@tabler/icons-react";
import { useState } from "react";
import { typedjson, useTypedLoaderData } from "remix-typedjson";
import { ValidatedForm, setFormDefaults, validationError } from "remix-validated-form";
import invariant from "tiny-invariant";

import { AddressForm } from "~/components/contacts/address-fields";
import { ContactFields } from "~/components/contacts/contact-fields";
import { ErrorComponent } from "~/components/error-component";
import { PageContainer } from "~/components/page-container";
import { PageHeader } from "~/components/page-header";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Callout } from "~/components/ui/callout";
import { Checkbox } from "~/components/ui/checkbox";
import { Label } from "~/components/ui/label";
import { Separator } from "~/components/ui/separator";
import { SubmitButton } from "~/components/ui/submit-button";
import { prisma } from "~/integrations/prisma.server";
import { ContactType } from "~/lib/constants";
import { forbidden, notFound } from "~/lib/responses.server";
import { toast } from "~/lib/toast.server";
import { useUser } from "~/lib/utils";
import { UpdateContactSchema } from "~/models/schemas";
import { ContactService } from "~/services/ContactService.server";
import { SessionService } from "~/services/SessionService.server";

const UpdateContactValidator = withZod(UpdateContactSchema);

export const loader = async ({ params, request }: LoaderFunctionArgs) => {
  const user = await SessionService.requireUser(request);
  invariant(params.contactId, "contactId not found");

  // Users can only edit their assigned contacts
  if (user.role === UserRole.USER && params.contactId !== user.contactId) {
    const assignment = await prisma.contactAssigment.findUnique({
      where: {
        contactId_userId: {
          contactId: params.contactId,
          userId: user.id,
        },
      },
    });
    if (!assignment) {
      throw forbidden({ message: "You do not have permission to edit this contact." });
    }
  }

  const [contactTypes, usersWhoCanBeAssigned] = await Promise.all([
    ContactService.getContactTypes(),
    prisma.user.findMany({
      where: {
        role: { notIn: [UserRole.SUPERADMIN] },
        contactId: { not: params.contactId },
      },
      include: {
        contact: true,
      },
    }),
  ]);

  const contact = await prisma.contact.findUnique({
    where: { id: params.contactId },
    include: {
      user: true,
      assignedUsers: {
        include: {
          user: {
            include: {
              contact: true,
            },
          },
        },
      },
      address: true,
      type: true,
    },
  });

  if (!contact) {
    throw notFound({ message: "Contact not found" });
  }

  return typedjson({
    contact,
    contactTypes,
    usersWhoCanBeAssigned,
    ...setFormDefaults("contact-form", { ...contact, typeId: contact.typeId.toString() }),
  });
};

export const meta: MetaFunction<typeof loader> = ({ data }) => [
  {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    title: `Edit ${data?.contact.firstName}${
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      data?.contact.lastName ? " " + data?.contact.lastName : ""
    } | Alliance 436`,
  },
];

export const action = async ({ request }: ActionFunctionArgs) => {
  const user = await SessionService.requireUser(request);
  const result = await UpdateContactValidator.validate(await request.formData());
  if (result.error) {
    return validationError(result.error);
  }

  const { address, assignedUserIds, ...formData } = result.data;

  if (formData.typeId === ContactType.Organization && !formData.organizationName) {
    return validationError(
      {
        fieldErrors: {
          organizationName: "Organization name is required for organization contacts.",
        },
      },
      result.data,
    );
  }

  // Users can only edit their assigned contacts and themselves
  if (user.role === UserRole.USER && formData.id !== user.contactId) {
    const assignment = await prisma.contactAssigment.findUnique({
      where: {
        contactId_userId: {
          contactId: formData.id,
          userId: user.id,
        },
      },
    });
    if (!assignment) {
      throw forbidden({ message: "You do not have permission to edit this contact." });
    }
  }

  // Users can't change their contact type
  if (user.role === UserRole.USER) {
    if (formData.typeId !== user.contact.typeId) {
      return forbidden({ message: "You do not have permission to change your contact type." });
    }
  }

  // Verify email is unique
  if (formData.email) {
    const existingContact = await prisma.contact.findUnique({
      where: { email: formData.email },
    });

    if (existingContact && existingContact.id !== formData.id) {
      return validationError({
        fieldErrors: {
          email: `A contact with this email already exists - ${existingContact.firstName} ${existingContact.lastName}`,
        },
      });
    }
  }

  const contact = await prisma.contact.update({
    where: { id: formData.id },
    data: {
      ...formData,
      assignedUsers: {
        // Rebuild the assigned users list
        deleteMany: {},
        create: assignedUserIds ? assignedUserIds.map((userId) => ({ userId })) : undefined,
      },
      address: address
        ? {
            upsert: {
              create: address,
              update: address,
            },
          }
        : undefined,
    },
    include: {
      address: true,
    },
  });

  return toast.redirect(request, `/contacts/${contact.id}`, {
    type: "success",
    title: "Contact updated",
    description: `${contact.firstName} ${contact.lastName} was updated successfully.`,
  });
};

export default function EditContactPage() {
  const user = useUser();
  const { contact, contactTypes, usersWhoCanBeAssigned } = useTypedLoaderData<typeof loader>();
  const [addressEnabled, setAddressEnabled] = useState(
    Object.values(contact.address ?? {}).some((v) => v !== "") ? true : false,
  );

  return (
    <>
      <PageHeader title="Edit Contact" />
      <div className="mt-1">
        {user.contactId === contact.id ? (
          <div className="max-w-sm">
            <Callout variant="warning">
              This is your contact information. Changing this email will not affect your login credentials, but may have
              other unintended effects.
            </Callout>
          </div>
        ) : (
          <div className="mt-4 flex flex-wrap items-center gap-2 sm:mt-1">
            <Badge variant="outline" className="capitalize">
              <div>
                <IconAddressBook className="size-3" />
              </div>
              <span>{contact.type.name.toLowerCase()}</span>
            </Badge>
            {contact.user ? (
              <Badge variant="secondary">
                <Link to={`/users/${contact.user.id}`} className="flex items-center gap-1.5">
                  <div>
                    <IconUser className="size-3" />
                  </div>
                  <span>{contact.user.username}</span>
                </Link>
              </Badge>
            ) : null}
          </div>
        )}
      </div>
      <PageContainer>
        <ValidatedForm
          id="contact-form"
          validator={UpdateContactValidator}
          method="post"
          className="space-y-4 sm:max-w-md"
        >
          <input type="hidden" name="id" value={contact.id} />
          <ContactFields contactTypes={contactTypes} />

          {!addressEnabled ? (
            <Button type="button" variant="outline" onClick={() => setAddressEnabled(true)}>
              Add Address
            </Button>
          ) : (
            <AddressForm />
          )}
          <Separator className="my-4" />
          {contact.typeId !== ContactType.Staff ? (
            <>
              <fieldset>
                <legend className="mb-4 text-sm text-muted-foreground">
                  Assign users to this Contact. They will receive regular reminders to log an engagement.
                  {contact.assignedUsers.some((a) => a.user.id === user.id) && user.role === UserRole.USER ? (
                    <p className="mt-2 rounded border border-warning/25 bg-warning/10 px-2 py-1.5 text-sm font-medium text-warning-foreground">
                      If you unassign yourself, you will no longer be able to view this contact&apos;s transactions or
                      make edits.
                    </p>
                  ) : null}
                </legend>
                <div className="flex flex-col gap-2">
                  {usersWhoCanBeAssigned.map((user) => {
                    return (
                      <Label key={user.id} className="inline-flex cursor-pointer items-center gap-2">
                        <Checkbox
                          name="assignedUserIds"
                          value={user.id}
                          defaultChecked={contact.assignedUsers.some((a) => a.user.id === user.id)}
                        />
                        <span>
                          {user.contact.firstName} {user.contact.lastName}
                        </span>
                      </Label>
                    );
                  })}
                </div>
              </fieldset>
              <Separator className="my-4" />
            </>
          ) : null}
          <div className="flex items-center gap-2">
            <SubmitButton>Save</SubmitButton>
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
