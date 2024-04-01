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
      {contacts.length === 0 ? (
        // @ts-expect-error see https://github.com/radix-ui/primitives/issues/1569#issuecomment-1567414323
        <SelectItem value={null} disabled>
          No Contacts
        </SelectItem>
      ) : null}
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
                  {c.typeId === ContactType.Organization ? `${c.organizationName}` : `${c.firstName} ${c.lastName}`}
                </SelectItem>
              ))}
          </SelectGroup>
        );
      })}
    </FormSelect>
  );
}
