import { Prisma } from "@prisma/client";

import { Sentry } from "~/integrations/sentry";
import { Operation } from "~/services.server/types";

export async function withServiceErrorHandling<M, T, O extends Operation>(
  operation: () => Promise<Prisma.Result<M, T, O>>,
) {
  try {
    return await operation();
  } catch (error) {
    Sentry.captureException(error);
    throw error;
  }
}
