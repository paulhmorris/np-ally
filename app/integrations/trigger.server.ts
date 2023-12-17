import { TriggerClient } from "@trigger.dev/sdk";

export const trigger = new TriggerClient({
  id: "alliance-436-admin-a1Fk",
  apiKey: process.env.TRIGGER_API_KEY,
  apiUrl: process.env.TRIGGER_API_URL,
});
