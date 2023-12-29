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
  typeId: z.coerce.number().pipe(z.nativeEnum(TransactionItemType)),
  methodId: z.coerce.number().pipe(z.nativeEnum(TransactionItemMethod)),
  amountInCents: CurrencySchema,
  description: z.string().optional(),
});

export const AddressSchema = z.object({
  street: z.string(),
  street2: z.string().optional(),
  city: z.string(),
  state: z.string().refine((val) => /^[A-Z]{2}$/.test(val), { message: "Invalid state" }),
  zip: z.string().refine((val) => /^\d{5}$/.test(val), { message: "Invalid zip code" }),
  country: z.string(),
});

export const NewContactSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  organizationName: z.string().optional(),
  email: z.string().email({ message: "Invalid email address" }),
  phone: z.string().length(10, "Phone number must be 10 digits").or(z.literal("")),
  typeId: z.coerce.number().pipe(z.nativeEnum(ContactType)),
  address: AddressSchema.optional(),
  assignedUserIds: zfd.repeatableOfType(zfd.text()).optional(),
});

export const UpdateContactSchema = NewContactSchema.extend({
  id: z.string().cuid(),
});
