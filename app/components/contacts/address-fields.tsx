import { FormField } from "~/components/ui/form";

export function AddressForm() {
  return (
    <fieldset className="space-y-4">
      <FormField label="Street 1" id="street" placeholder="1234 Main St." name="address.street" required />
      <div className="flex items-start gap-2">
        <FormField label="Street 2" id="street2" placeholder="Apt 4" name="address.street2" />
        <FormField label="City" id="city" placeholder="Richardson" name="address.city" required />
      </div>
      <div className="grid grid-cols-2 items-start gap-2 md:grid-cols-12">
        <div className="col-span-6">
          <FormField label="State / Province" id="state-province" placeholder="TX" name="address.state" required />
        </div>
        <div className="col-span-1 w-full sm:col-span-3">
          <FormField label="Postal Code" id="zip" placeholder="75080" name="address.zip" required />
        </div>
        <div className="col-span-1 w-full sm:col-span-3">
          <FormField label="Country" id="country" placeholder="US" name="address.country" required defaultValue="US" />
        </div>
      </div>
    </fieldset>
  );
}
