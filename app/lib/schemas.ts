import { z } from "zod";

import { ContactType, TransactionItemMethod, TransactionItemType } from "~/lib/constants";

export const CheckboxSchema = z.string().transform((val) => val === "on");

export const TransactionItemSchema = z.object({
  typeId: z.coerce.number().pipe(z.nativeEnum(TransactionItemType)),
  methodId: z.coerce.number().pipe(z.nativeEnum(TransactionItemMethod)),
  amountInCents: z.coerce
    .number({ invalid_type_error: "Must be a number", required_error: "Amount required" })
    .nonnegative({ message: "Must be greater than $0" })
    .max(99_999, { message: "Must be less than $100,000" })
    .transform((dollars) => Math.round(dollars * 100)),
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
  firstName: z.string().min(1, { message: "First name is required" }),
  lastName: z.string().optional(),
  email: z.string().email({ message: "Invalid email address" }),
  phone: z.string().length(10, "Phone number must be 10 digits").optional(),
  typeId: z.coerce
    .number()
    .pipe(z.nativeEnum(ContactType))
    // You can only create donors from this page
    .refine((v) => v === ContactType.Donor),
  address: AddressSchema.optional(),
});

export const UpdateContactSchema = NewContactSchema.extend({
  id: z.string().cuid(),
});
