import { FormField, FormSelect } from "~/components/ui/form";
import { SelectItem } from "~/components/ui/select";
import { STATES } from "~/lib/data";

export function AddressForm() {
  return (
    <fieldset className="space-y-4">
      <FormField label="Street 1" id="street" placeholder="1234 Main St." name="address.street" required />
      <div className="flex items-start gap-2">
        <FormField label="Street 2" id="street2" placeholder="Apt 4" name="address.street2" />
        <FormField label="City" id="city" placeholder="Richardson" name="address.city" required />
      </div>
      <div className="flex items-start gap-2">
        <FormSelect label="State" id="state" placeholder="Select state" name="address.state" required>
          {STATES.map((state) => (
            <SelectItem key={state} value={state}>
              {state}
            </SelectItem>
          ))}
        </FormSelect>
        <FormField label="Zip" id="zip" placeholder="75080" name="address.zip" required />
        <FormField label="Country" id="country" placeholder="US" name="address.country" required defaultValue="US" />
      </div>
    </fieldset>
  );
}
