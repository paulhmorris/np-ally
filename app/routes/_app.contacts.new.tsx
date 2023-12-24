import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import type { MetaFunction } from "@remix-run/react";
import { withZod } from "@remix-validated-form/with-zod";
import { IconX } from "@tabler/icons-react";
import { useState } from "react";
import { typedjson, useTypedLoaderData } from "remix-typedjson";
import { ValidatedForm, useFieldArray, validationError } from "remix-validated-form";

import { ErrorComponent } from "~/components/error-component";
import { PageContainer } from "~/components/page-container";
import { PageHeader } from "~/components/page-header";
import { Button } from "~/components/ui/button";
import { FormField } from "~/components/ui/form";
import { Label } from "~/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { Separator } from "~/components/ui/separator";
import { SubmitButton } from "~/components/ui/submit-button";
import { prisma } from "~/integrations/prisma.server";
import { ContactType } from "~/lib/constants";
import { requireUser } from "~/lib/session.server";
import { toast } from "~/lib/toast.server";
import { NewContactSchema } from "~/models/schemas";

const NewContactValidator = withZod(NewContactSchema);

export const meta: MetaFunction = () => [{ title: "New Contact • Alliance 436" }];

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await requireUser(request);
  const usersWhoCanBeAssigned = await prisma.user.findMany({
    // where: { role: { in: [UserRole.USER, UserRole.ADMIN] } },
    select: {
      id: true,
      contact: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
  });

  return typedjson({
    usersWhoCanBeAssigned,
  });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  await requireUser(request);
  const result = await NewContactValidator.validate(await request.formData());
  if (result.error) return validationError(result.error);

  const { address, ...formData } = result.data;

  const existingContact = await prisma.contact.findUnique({
    where: { email: formData.email },
  });

  if (existingContact) {
    return validationError({
      fieldErrors: {
        email: `A contact with this email already exists - ${existingContact.firstName} ${existingContact.lastName}`,
      },
    });
  }

  const contact = await prisma.contact.create({
    data: {
      ...formData,
      address: {
        create: address,
      },
    },
  });

  return toast.redirect(request, `/contacts/${contact.id}`, {
    title: "Contact created",
    description: `${contact.firstName} ${contact.lastName} was created successfully.`,
  });
};

export default function NewContactPage() {
  const { usersWhoCanBeAssigned } = useTypedLoaderData<typeof loader>();
  const [items, { push, remove }] = useFieldArray("assignedUsers", { formId: "contact-form" });
  const [addressEnabled, setAddressEnabled] = useState(false);
  const [userSelectValue, setUserSelectValue] = useState<string>("");

  return (
    <>
      <PageHeader title="New Contact" />
      <PageContainer>
        <ValidatedForm validator={NewContactValidator} method="post" className="space-y-4 sm:max-w-md">
          <div className="flex items-start gap-2">
            <FormField label="First name" id="firstName" name="firstName" placeholder="Joe" required />
            <FormField label="Last name" id="lastName" name="lastName" placeholder="Donor" />
          </div>
          <FormField label="Email" id="email" name="email" placeholder="joe@donor.com" required />
          <FormField
            label="Phone"
            id="phone"
            name="phone"
            placeholder="8885909724"
            inputMode="numeric"
            maxLength={10}
          />
          <input type="hidden" name="typeId" value={ContactType.Donor} />

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
                <FormField label="State" id="state" placeholder="TX" name="address.state" required />
                <FormField label="Zip" id="zip" placeholder="75080" name="address.zip" required />
                <FormField
                  label="Country"
                  id="zip"
                  placeholder="US"
                  name="address.country"
                  required
                  defaultValue="US"
                />
              </div>
            </fieldset>
          )}
          <Separator className="my-4" />
          <fieldset>
            <legend className="mb-4 text-sm text-muted-foreground">Assign users to this contact.</legend>
            {items.map(({ key, defaultValue }, index) => {
              console.log({
                key,
                defaultValue,
                index,
                usersWhoCanBeAssigned,
              });
              const user = usersWhoCanBeAssigned.find((u) => u.id === defaultValue.id);
              if (!user) return null;
              const fieldPrefix = `assignedUsers[${index}]`;
              return (
                <div key={key} className="inline-flex items-center gap-2 rounded-md bg-secondary p-2">
                  {/* eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */}
                  <input type="hidden" name={`${fieldPrefix}.id`} value={defaultValue.id} />
                  <span>{user.contact.email}</span>
                  <button
                    className="flex items-center justify-center bg-secondary p-1 text-secondary-foreground"
                    onClick={() => remove(index)}
                  >
                    <span className="sr-only">Remove</span>
                    <IconX className="h-4 w-4" />
                  </button>
                </div>
              );
            })}
            <div className="relative w-full">
              <Label htmlFor="users" className="mb-1">
                Users
              </Label>
              <Select
                onValueChange={(val) => {
                  console.log({ val });
                  push({ id: val });
                }}
              >
                <SelectTrigger id="users">
                  <SelectValue placeholder="Select user" />
                </SelectTrigger>
                <SelectContent>
                  <option value="" />
                  {usersWhoCanBeAssigned.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.contact.firstName} {user.contact.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </fieldset>
          <Separator className="my-4" />
          <div className="flex items-center gap-2">
            <SubmitButton>Create Contact</SubmitButton>
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
