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
    // At 9a CST on Monday.
    cron: "0 15 * * 1",
  }),
  integrations: {
    resend: triggerResend,
  },
  run: async (_, io) => {
    const thirtyDaysAgo = new Date(Date.now() - DAYS_CUTOFF * 24 * 60 * 60 * 1000);
    const assignments = await io.runTask("get-contact-assignments", async () => {
      return prisma.contactAssigment.findMany({
        where: {
          contact: {
            typeId: {
              not: ContactType.Staff,
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
        },
        select: {
          contact: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
          user: {
            select: {
              contact: {
                select: {
                  firstName: true,
                  email: true,
                },
              },
            },
          },
        },
      });
    });

    if (assignments.length === 0) {
      await io.logger.info("No contacts to remind. Exiting.");
      return {
        success: true,
        count: 0,
      };
    }

    type Accumulator = Record<
      string,
      { user: Record<string, string>; contacts: Array<{ firstName: string; lastName: string }> }
    >;
    // eslint-disable-next-line @typescript-eslint/require-await
    const emails = await io.runTask("prepare-emails", async () => {
      // Transform db data into a map of unique user emails with an array of their contacts.
      const temp = assignments.reduce((acc: Accumulator, curr) => {
        if (!curr.user.contact.email || (!curr.contact.firstName && !curr.contact.lastName)) {
          return acc;
        }

        const userEmail = curr.user.contact.email;

        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        if (!acc[userEmail]) {
          acc[userEmail] = {
            user: {
              ...(curr.user.contact as { firstName: string; email: string }),
            },
            contacts: [],
          };
        }

        acc[userEmail].contacts.push(curr.contact as { firstName: string; lastName: string });

        return acc;
      }, {});

      // Convert the map into an array of emails.
      const emails = Object.values(temp).map((u) => {
        return {
          from: "Alliance 436 <no-reply@alliance436.org>",
          to: u.user.email,
          subject: "Contact Reminder",
          html: `Hi ${u.user.firstName}, your contact${u.contacts.length === 1 ? "" : "s"} <br />${u.contacts
            .map((c) => `<span style="font-weight:bold;">${c.firstName} ${c.lastName}</span>`)
            .join(
              "<br />",
            )} ${u.contacts.length === 1 ? "has" : "have"} not been contacted in at least 30 days. This is a friendly reminder to reach out to them.`,
        };
      });
      return emails;
    });

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
