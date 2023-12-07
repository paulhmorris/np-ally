import { z } from "zod";

import { TransactionItemMethod, TransactionItemType } from "~/lib/constants";

export const Checkbox = z.string().transform((val) => val === "on");

export const TransactionItemSchema = z.object({
  typeId: z.coerce.number().transform((val, ctx) => {
    if (!Object.values(TransactionItemType).includes(val)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Invalid type`,
        path: [],
      });
      return z.NEVER;
    }
    return val;
  }),
  methodId: z.coerce.number().transform((val, ctx) => {
    if (!Object.values(TransactionItemMethod).includes(val)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Invalid method`,
      });
      return z.NEVER;
    }
    return val;
  }),
  amountInCents: z.coerce
    .number({ invalid_type_error: "Must be a number", required_error: "Amount required" })
    .nonnegative({ message: "Must be greater than $0" })
    .max(99_999, { message: "Must be less than $100,000" })
    .transform((dollars) => Math.round(dollars * 100)),
  description: z.string().optional(),
});
