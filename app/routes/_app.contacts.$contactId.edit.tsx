import { UserRole } from "@prisma/client";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import type { MetaFunction } from "@remix-run/react";
import { withZod } from "@remix-validated-form/with-zod";
import { useState } from "react";
import { typedjson, useTypedLoaderData } from "remix-typedjson";
import { ValidatedForm, setFormDefaults, validationError } from "remix-validated-form";
import invariant from "tiny-invariant";

import { ErrorComponent } from "~/components/error-component";
import { PageContainer } from "~/components/page-container";
import { PageHeader } from "~/components/page-header";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Callout } from "~/components/ui/callout";
import { Checkbox } from "~/components/ui/checkbox";
import { FormField, FormSelect } from "~/components/ui/form";
import { Label } from "~/components/ui/label";
import { SelectItem } from "~/components/ui/select";
import { Separator } from "~/components/ui/separator";
import { SubmitButton } from "~/components/ui/submit-button";
import { prisma } from "~/integrations/prisma.server";
import { ContactType } from "~/lib/constants";
import { states } from "~/lib/data";
import { forbidden, notFound } from "~/lib/responses.server";
import { requireUser } from "~/lib/session.server";
import { toast } from "~/lib/toast.server";
import { useUser } from "~/lib/utils";
import { UpdateContactSchema } from "~/models/schemas";

const UpdateContactValidator = withZod(UpdateContactSchema);

export const meta: MetaFunction = () => [{ title: "Edit Contact • Alliance 436" }];

export const loader = async ({ params, request }: LoaderFunctionArgs) => {
  const user = await requireUser(request);
  invariant(params.contactId, "contactId not found");

  // Users can only edit their assigned contacts
  if (user.role === UserRole.USER) {
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

  const usersWhoCanBeAssigned = await prisma.user.findMany({
    where: { role: { in: [UserRole.USER, UserRole.ADMIN] } },
    include: {
      contact: true,
    },
  });

  const contact = await prisma.contact.findUnique({
    where: { id: params.contactId },
    include: {
      _count: {
        select: {
          transactions: true,
        },
      },
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
    usersWhoCanBeAssigned,
    ...setFormDefaults("contact-form", { ...contact }),
  });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const user = await requireUser(request);
  const result = await UpdateContactValidator.validate(await request.formData());
  if (result.error) return validationError(result.error);

  const { address, assignedUserIds, ...formData } = result.data;

  const existingContact = await prisma.contact.findUnique({
    where: { email: formData.email },
    include: {
      _count: {
        select: {
          transactions: true,
        },
      },
    },
  });

  if (!existingContact) {
    throw notFound({ message: "Contact not found" });
  }

  // Verify email is unique
  if (existingContact.id !== formData.id) {
    return validationError({
      fieldErrors: {
        email: `A contact with this email already exists - ${existingContact.firstName} ${existingContact.lastName}`,
      },
    });
  }

  // Contacts with transactions cannot have their type changed
  if (existingContact._count.transactions > 0 && formData.typeId !== ContactType.Donor) {
    return validationError({
      fieldErrors: {
        typeId: `This contact has transactions so it's type must be "Donor".`,
      },
    });
  }

  // Users can only edit their assigned contacts
  if (user.role === UserRole.USER) {
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
    title: "Contact updated",
    description: `${contact.firstName} ${contact.lastName} was updated successfully.`,
  });
};

export default function EditContactPage() {
  const user = useUser();
  const { contact, usersWhoCanBeAssigned } = useTypedLoaderData<typeof loader>();
  const [addressEnabled, setAddressEnabled] = useState(
    Object.values(contact.address ?? {}).some((v) => v !== "") ? true : false,
  );

  return (
    <>
      <PageHeader title="Edit Contact" />
      <div className="mt-1">
        {user.contactId === contact.id ? (
          <div className="max-w-sm">
            <Callout className="text-xs">
              This is your contact information. Changing this email will not affect your login credentials, but may have
              other unintended effects.
            </Callout>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="capitalize">
              Type: {contact.type.name.toLowerCase()}
            </Badge>
            {contact.user ? (
              <Badge variant="outline" className="capitalize">
                Role: {contact.user.role.toLowerCase()}
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
          <div className="flex items-start gap-2">
            <FormField label="First name" id="firstName" name="firstName" required />
            <FormField label="Last name" id="lastName" name="lastName" />
          </div>
          <FormField label="Email" id="email" name="email" required />
          <FormField label="Phone" id="phone" name="phone" inputMode="numeric" maxLength={10} />
          <FormSelect
            required
            name="typeId"
            label="Type"
            placeholder="Select type"
            defaultValue={contact.typeId}
            disabled={contact._count.transactions > 0}
            description={
              contact._count.transactions > 0
                ? `This contact has transactions so it's type must be "Donor".`
                : undefined
            }
            options={[
              { label: "Donor", value: ContactType.Donor },
              { label: "External", value: ContactType.External },
            ]}
          />

          {!addressEnabled ? (
            <Button variant="outline" onClick={() => setAddressEnabled(true)}>
              Add Address
            </Button>
          ) : (
            <fieldset className="space-y-4">
              <FormField label="Street 1" id="street" placeholder="1234 Main St." name="address.street" required />
              <div className="flex items-start gap-2">
                <FormField label="Street 2" id="street" placeholder="Apt 4" name="address.street2" />
                <FormField label="City" id="city" placeholder="Richardson" name="address.city" required />
              </div>
              <div className="flex items-start gap-2">
                <FormSelect label="State" id="state" placeholder="Select state" name="address.state" required>
                  {states.map((state) => (
                    <SelectItem key={state} value={state}>
                      {state}
                    </SelectItem>
                  ))}
                </FormSelect>
                <FormField label="Zip" id="zip" placeholder="75080" name="address.zip" required />
                <FormField label="Country" id="zip" placeholder="US" name="address.country" required />
              </div>
            </fieldset>
          )}
          <Separator className="my-4" />
          {/* eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison */}
          {contact.typeId === ContactType.Donor || contact.typeId === ContactType.External ? (
            <>
              <fieldset>
                <legend className="mb-4 text-sm text-muted-foreground">
                  Assign users to this contact. They will receive regular reminders to engage with this Contact.
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
            <SubmitButton>Update Contact</SubmitButton>
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
