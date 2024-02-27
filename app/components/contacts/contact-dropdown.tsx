/* eslint-disable @typescript-eslint/no-unsafe-enum-comparison */
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
  console.log("contacts", contacts);
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
              .map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {/* eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison */}
                  {c.typeId === ContactType.Organization ? c.organizationName : c.fullName}
                </SelectItem>
              ))}
          </SelectGroup>
        );
      })}
    </FormSelect>
  );
}
