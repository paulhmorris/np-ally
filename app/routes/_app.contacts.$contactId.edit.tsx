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
import { Button } from "~/components/ui/button";
import { FormField, FormSelect } from "~/components/ui/form";
import { SelectItem } from "~/components/ui/select";
import { Separator } from "~/components/ui/separator";
import { SubmitButton } from "~/components/ui/submit-button";
import { prisma } from "~/integrations/prisma.server";
import { ContactType } from "~/lib/constants";
import { states } from "~/lib/data";
import { UpdateContactSchema } from "~/lib/schemas";
import { requireUser } from "~/lib/session.server";
import { toast } from "~/lib/toast.server";

const UpdateContactValidator = withZod(UpdateContactSchema);

export const meta: MetaFunction = () => [{ title: "Edit Contact • Alliance 436" }];

export const loader = async ({ params, request }: LoaderFunctionArgs) => {
  await requireUser(request);
  await requireUser(request, ["ADMIN", "SUPERADMIN"]);
  invariant(params.contactId, "contactId not found");

  const contact = await prisma.contact.findUnique({
    where: { id: params.contactId },
    include: {
      address: true,
      type: true,
    },
  });

  return typedjson({
    contact,
    ...setFormDefaults("contact-form", { ...contact }),
  });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const user = await requireUser(request);
  const result = await UpdateContactValidator.validate(await request.formData());
  if (result.error) return validationError(result.error);

  const { address, ...data } = result.data;

  // Users can only edit their donors
  if (user.role === UserRole.USER) {
    const relatedContacts = await prisma.contact.findMany({
      where: {
        transactions: {
          some: {
            account: {
              userId: user.id,
            },
          },
        },
      },
    });
    if (!relatedContacts.some((c) => c.id === data.id)) {
      return toast.json(
        request,
        { message: "You do not have permission to edit this contact." },
        {
          variant: "destructive",
          title: "Permission denied",
          description: "You do not have permission to edit this contact.",
        },
        { status: 403 },
      );
    }
  }

  const contact = await prisma.contact.update({
    where: { id: data.id },
    data: {
      ...data,
      address: {
        update: address,
      },
    },
  });

  return toast.json(
    request,
    { contact },
    {
      title: "Contact updated",
      description: `${contact.firstName} ${contact.lastName} was updated successfully.`,
    },
  );
};

export default function EditContactPage() {
  const { contact } = useTypedLoaderData<typeof loader>();
  const [addressEnabled, setAddressEnabled] = useState(
    Object.values(contact?.address ?? {}).some((v) => v !== "") ? true : false,
  );

  return (
    <>
      <PageHeader title="Edit Contact" />
      <PageContainer>
        <ValidatedForm
          id="contact-form"
          validator={UpdateContactValidator}
          method="post"
          className="space-y-4 sm:max-w-md"
        >
          <input type="hidden" name="id" value={contact?.id} />
          <div className="flex items-start gap-2">
            <FormField label="First name" id="firstName" name="firstName" required />
            <FormField label="Last name" id="lastName" name="lastName" />
          </div>
          <FormField label="Email" id="email" name="email" required />
          <FormField label="Phone" id="phone" name="phone" inputMode="numeric" maxLength={10} />
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
                <FormSelect label="State" id="state" placeholder="TX" name="address.state" required>
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
