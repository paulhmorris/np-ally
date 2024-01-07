import { ContactType } from "@prisma/client";

import { FormField, FormSelect } from "~/components/ui/form";

export function ContactFields({ contactTypes }: { contactTypes: Array<ContactType> }) {
  return (
    <>
      <div className="flex items-start gap-2">
        <FormField label="First name" id="firstName" name="firstName" placeholder="Joe" required />
        <FormField label="Last name" id="lastName" name="lastName" placeholder="Donor" />
      </div>
      <FormField label="Email" id="email" name="email" placeholder="joe@donor.com" required />
      <FormField label="Phone" id="phone" name="phone" placeholder="8885909724" inputMode="numeric" maxLength={10} />
      <FormSelect
        required
        label="Type"
        name="typeId"
        placeholder="Select type"
        options={contactTypes.map((ct) => ({
          label: ct.name,
          value: ct.id,
        }))}
      />
      <FormField
        label="Organization Name"
        name="organizationName"
        placeholder="Alliance 436"
        description="Required if type is Organization"
      />
    </>
  );
}
