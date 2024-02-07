import { cronTrigger } from "@trigger.dev/sdk";

import { prisma } from "~/integrations/prisma.server";
import { trigger, triggerResend } from "~/integrations/trigger.server";
import { ContactType } from "~/lib/constants";

const DAYS_CUTOFF = 30;

export const engagementReminderJob = trigger.defineJob({
  id: "engagement-reminder",
  name: "Engagement Reminder",
  version: "0.0.1",
  enabled: process.env.VERCEL_ENV === "production",
  trigger: cronTrigger({
    // Every day at 3pm UTC / 9am CST
    cron: "0 15 * * 1-5",
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
            notIn: [ContactType.Staff],
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
              user: {
                select: {
                  contact: true,
                },
              },
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
        ...u.user.contact,
        assignedContact: `${c.firstName} ${c.lastName}`,
      })),
    );

    const emails = usersToRemind
      .map((u) => {
        if (!u.email) {
          return null;
        }
        return {
          from: "Alliance 436 <no-reply@alliance436.org>",
          to: u.email,
          subject: "Contact Reminder",
          html: `Hi ${u.firstName}, your contact <span style="font:bold;">${u.assignedContact}</span> has not been contacted in 30 days. This is a friendly reminder to reach out to them.`,
        };
      })
      .filter(Boolean);

    if (emails.length > 90) {
      await io.logger.warn(
        "Resend only supports up to 100 emails per batch. Please return to this code and add batch splitting.",
      );
    }

    await io.resend.batch.send("send-emails", [...emails]);

    return {
      success: true,
      count: emails.length,
    };
  },
});
