import { z } from "zod";
import { zfd } from "zod-form-data";

import { ContactType, TransactionItemMethod, TransactionItemType } from "~/lib/constants";

export const CheckboxSchema = z
  .string()
  .transform((val) => val === "on")
  .or(z.undefined());

export const CurrencySchema = z.coerce
  .number({ invalid_type_error: "Must be a number", required_error: "Amount required" })
  .multipleOf(0.01, { message: "Must be multiple of $0.01" })
  .nonnegative({ message: "Must be greater than $0.00" })
  .max(99_999, { message: "Must be less than $100,000" })
  .transform((dollars) => Math.round(dollars * 100));

export const TransactionItemSchema = z.object({
  typeId: z.coerce.number().pipe(z.nativeEnum(TransactionItemType, { invalid_type_error: "Invalid type" })),
  methodId: z.coerce.number().pipe(z.nativeEnum(TransactionItemMethod, { invalid_type_error: "Invalid method" })),
  amountInCents: CurrencySchema,
  description: z.string().optional(),
});

export const AddressSchema = z.object({
  street: z.string(),
  street2: z.string().optional(),
  city: z.string(),
  state: z.string(),
  zip: z.string(),
  country: z.string().max(5),
});

export const NewContactSchema = z.object({
  firstName: z.string().max(255).optional(),
  lastName: z.string().max(255).optional(),
  organizationName: z.string().max(255).optional(),
  email: zfd.text(z.string().email({ message: "Invalid email address" }).optional()),
  phone: zfd.text(
    z
      .string()
      .transform((val) => val.replace(/\D/g, ""))
      .pipe(z.string().length(10, { message: "Invalid phone number" }))
      .optional(),
  ),
  typeId: z.coerce.number().pipe(z.nativeEnum(ContactType)),
  address: AddressSchema.optional(),
  assignedUserIds: zfd.repeatableOfType(zfd.text()).optional(),
});

export const UpdateContactSchema = NewContactSchema.extend({
  id: z.string().cuid(),
});
