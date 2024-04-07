import { invokeTrigger } from "@trigger.dev/sdk";
import { z } from "zod";

import { db } from "~/integrations/prisma.server";
import { trigger, triggerResend } from "~/integrations/trigger.server";

export const notifySubscribersJob = trigger.defineJob({
  id: "notify-user-income",
  name: "Notify user of income",
  version: "0.0.1",
  trigger: invokeTrigger({
    schema: z.object({
      to: z.union([z.string(), z.array(z.string())]),
      orgId: z.string(),
    }),
  }),
  integrations: {
    resend: triggerResend,
  },
  run: async (payload, io) => {
    const org = await io.runTask("get-org", async () => {
      return db.organization.findUnique({
        where: { id: payload.orgId },
        select: {
          name: true,
          host: true,
          replyToEmail: true,
        },
      });
    });

    if (!org || !org.host || !org.replyToEmail) {
      await io.logger.error(`No organization found with id ${payload.orgId}`);
      return {
        status: "error",
        message: `No organization found with id ${payload.orgId}`,
      };
    }

    const url = new URL("/", `https://${org.host}`);

    await io.resend.emails.send("send-email", {
      from: `${org.name} <${org.replyToEmail}@${org.host}>`,
      to: payload.to,
      subject: "You have new income!",
      html: `You have new income! Check it out on your <a href="${url.toString()}">Dashboard</a>.`,
    });
  },
});
