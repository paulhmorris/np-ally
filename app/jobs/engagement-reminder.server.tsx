import { cronTrigger } from "@trigger.dev/sdk";

import { EngagementReminderEmail } from "emails/engagement-reminder";
import { db } from "~/integrations/prisma.server";
import { trigger, triggerResend } from "~/integrations/trigger.server";
import { ContactType } from "~/lib/constants";
import { CreateEmailOptions } from "~/services.server/mail";

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
      return db.contactAssigment.findMany({
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
      { user: { firstName: string; email: string }; contacts: Array<{ firstName: string; lastName: string }> }
    >;
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
    const mappedEmails: Array<CreateEmailOptions> = Object.values(temp).map(({ user, contacts }) => {
      return {
        from: "Alliance 436 <no-reply@alliance436.org>",
        to: user.email,
        subject: "Contact Reminder",
        react: <EngagementReminderEmail contacts={contacts} userFirstName={user.firstName} />,
      };
    });

    if (mappedEmails.length > 90) {
      await io.logger.warn(
        "Resend only supports up to 100 emails per batch. Please return to this code and add batch splitting.",
      );
    }

    await io.resend.batch.send("send-emails", [...mappedEmails]);

    return {
      success: true,
      count: mappedEmails.length,
    };
  },
});
