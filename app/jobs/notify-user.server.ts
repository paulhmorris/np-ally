import { Resend } from "@trigger.dev/resend";
import { eventTrigger } from "@trigger.dev/sdk";
import { z } from "zod";

import { trigger } from "~/integrations/trigger.server";

const resend = new Resend({
  id: "resend",
  apiKey: process.env.RESEND_API_KEY,
});

export const job = trigger.defineJob({
  id: "notify-user-income",
  name: "Notify user of income",
  version: "0.0.1",
  trigger: eventTrigger({
    name: "income.created",
    schema: z.object({
      to: z.union([z.string(), z.array(z.string())]),
    }),
  }),
  integrations: {
    resend,
  },
  run: async (payload, io) => {
    await io.resend.emails.send("send-email", {
      to: payload.to,
      subject: "You have new income!",
      html: `You have new income! Check it out on your <a href="http://localhost:3000">Dashboard</a>.`,
      from: "no-reply@getcosmic.dev",
    });
  },
});
