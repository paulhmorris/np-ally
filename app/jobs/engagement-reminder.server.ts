import { cronTrigger } from "@trigger.dev/sdk";

import { prisma } from "~/integrations/prisma.server";
import { trigger, triggerResend } from "~/integrations/trigger.server";
import { ContactType } from "~/lib/constants";

const DAYS_CUTOFF = 30;

export const engagementReminderJob = trigger.defineJob({
  id: "engagement-reminder",
  name: "Engagement Reminder",
  version: "0.0.1",
  trigger: cronTrigger({
    // Every day at 1pm UTC
    cron: "0 13 * * *",
  }),
  integrations: {
    resend: triggerResend,
  },
  run: async (_, io) => {
    const thirtyDaysAgo = new Date(Date.now() - DAYS_CUTOFF * 24 * 60 * 60 * 1000);
    const contacts = await io.runTask("get-contacts", async () => {
      return prisma.contact.findMany({
        where: {
          typeId: {
            in: [ContactType.External, ContactType.Donor, ContactType.Organization],
          },
          engagements: {
            some: {},
            every: {
              date: {
                lte: thirtyDaysAgo,
              },
            },
          },
        },
        select: {
          firstName: true,
          lastName: true,
          assignedUsers: {
            select: {
              contact: true,
            },
          },
        },
      });
    });

    if (contacts.length === 0) {
      await io.logger.info("No contacts to remind. Exiting.");
      return {
        success: true,
        count: 0,
      };
    }

    const usersToRemind = contacts.flatMap((c) =>
      c.assignedUsers.map((u) => ({
        ...u.contact,
        assignedContact: `${c.firstName} ${c.lastName}`,
      })),
    );

    const emails = usersToRemind.map((u) => {
      return {
        from: "no-reply@getcosmic.dev",
        to: u.email,
        subject: "Alliance 436 - Contact Reminder",
        html: `Hi ${u.firstName}, your contact <span style="font:bold;">${u.assignedContact}</span> has not been contacted in 30 days. This is a friendly reminder to reach out to them.`,
      };
    });

    await io.resend.batch.send("send-emails", [...emails]);

    return {
      success: true,
      count: emails.length,
    };
  },
});
