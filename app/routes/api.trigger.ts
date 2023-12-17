import { createRemixRoute } from "@trigger.dev/remix";

import { trigger } from "~/integrations/trigger.server";
export * from "~/jobs/example.server";
export const { action } = createRemixRoute(trigger);
