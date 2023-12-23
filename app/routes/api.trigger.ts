import { createRemixRoute } from "@trigger.dev/remix";

import { trigger } from "~/integrations/trigger.server";
export * from "~/jobs/donation-summary.server";
export * from "~/jobs/notify-subscribers.server";
export const { action } = createRemixRoute(trigger);
