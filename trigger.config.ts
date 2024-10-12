import { prismaExtension } from "@trigger.dev/build/extensions/prisma";
import { defineConfig } from "@trigger.dev/sdk/v3";

import { Sentry } from "./app/integrations/sentry";

export default defineConfig({
  dirs: ["./app/jobs"],
  project: "proj_onljbcqyipyvqioltokh",
  build: {
    extensions: [prismaExtension({ schema: "prisma/schema.prisma" })],
  },
  // eslint-disable-next-line @typescript-eslint/require-await
  onFailure: async (_, error, _params) => {
    Sentry.captureException(error);
  },
});
