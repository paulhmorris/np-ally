import { PrismaInstrumentation } from "@prisma/instrumentation";
import type { TriggerConfig } from "@trigger.dev/sdk/v3";

import { Sentry } from "~/integrations/sentry";

export const config: TriggerConfig = {
  project: "proj_onljbcqyipyvqioltokh",
  triggerDirectories: ["./app/jobs"],
  instrumentations: [new PrismaInstrumentation()],
  // eslint-disable-next-line @typescript-eslint/require-await
  onFailure: async (_, error, _params) => {
    Sentry.captureException(error);
  },
  dependenciesToBundle: ["nanoid"],
  additionalFiles: ["./prisma/schema.prisma"],
  additionalPackages: ["prisma@5.15.0", "patch-package"],
};
