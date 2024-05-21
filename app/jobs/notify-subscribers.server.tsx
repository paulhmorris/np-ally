import { invokeTrigger } from "@trigger.dev/sdk";
import { z } from "zod";

import { IncomeNotificationEmail } from "emails/income-notification";
import { db } from "~/integrations/prisma.server";
import { trigger, triggerResend } from "~/integrations/trigger.server";

export const notifySubscribersJob = trigger.defineJob({
  id: "notify-user-income",
  name: "Notify user of income",
  version: "0.0.1",
  trigger: invokeTrigger({
    schema: z.object({
      to: z.string().email(),
      accountName: z.string(),
      amountInCents: z.number(),
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
          subdomain: true,
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

    const user = await io.runTask("get-user", async () => {
      return db.user.findUnique({
        where: { username: payload.to },
        select: {
          contact: {
            select: {
              firstName: true,
            },
          },
        },
      });
    });

    if (!user) {
      await io.logger.error(`No user found with username ${payload.to}`);
      return {
        status: "error",
        message: `No user found with username ${payload.to}`,
      };
    }

    const url = new URL("/", `https://${org.subdomain ? org.subdomain + "." : ""}${org.host}`).toString();

    await io.resend.emails.send("send-email", {
      from: `${org.name} <${org.replyToEmail}@${org.host}>`,
      to: payload.to,
      subject: "You have new income!",
      react: (
        <IncomeNotificationEmail
          url={url}
          accountName={payload.accountName}
          amountInCents={payload.amountInCents}
          userFirstname={user.contact.firstName}
        />
      ),
    });
  },
});
