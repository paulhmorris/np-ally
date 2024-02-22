import { type Contact, type ContactType as PContactType } from "@prisma/client";

import { FormSelect, FormSelectProps } from "~/components/ui/form";
import { SelectGroup, SelectItem, SelectLabel } from "~/components/ui/select";
import { ContactType } from "~/lib/constants";

export function ContactDropdown(
  props: {
    types: Array<PContactType>;
    contacts: Array<Contact>;
  } & Omit<FormSelectProps, "placeholder">,
) {
  const { types, contacts, name, label, ...rest } = props;
  return (
    <FormSelect name={name} label={label} placeholder="Select contact" {...rest}>
      {types.map((type) => {
        if (!contacts.some((c) => c.typeId === type.id)) {
          return null;
        }
        return (
          <SelectGroup key={type.name}>
            <SelectLabel>{type.name}</SelectLabel>
            {contacts
              .filter((c) => c.typeId === type.id)
              .sort((a, b) => {
                if (
                  a.typeId === ContactType.Organization &&
                  b.typeId === ContactType.Organization &&
                  a.organizationName &&
                  b.organizationName
                ) {
                  return a.organizationName.localeCompare(b.organizationName);
                }

                if (a.lastName && b.lastName) {
                  return a.lastName.localeCompare(b.lastName);
                }

                if (a.firstName && b.firstName) {
                  return a.firstName.localeCompare(b.firstName);
                }

                return 0;
              })
              .map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.typeId === ContactType.Organization ? `${c.organizationName}` : `${c.firstName} ${c.lastName}`}
                </SelectItem>
              ))}
          </SelectGroup>
        );
      })}
    </FormSelect>
  );
}
