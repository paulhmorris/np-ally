import { Resend } from "@trigger.dev/resend";
import { TriggerClient } from "@trigger.dev/sdk";

export const trigger = new TriggerClient({
  id: "alliance-436-admin-a1Fk",
  apiKey: process.env.TRIGGER_API_KEY,
  apiUrl: process.env.TRIGGER_API_URL,
  ioLogLocalEnabled: process.env.NODE_ENV === "development",
});

export const triggerResend = new Resend({
  id: "resend",
  apiKey: process.env.RESEND_API_KEY,
});
