import { cronTrigger } from "@trigger.dev/sdk";

import { db } from "~/integrations/prisma.server";
import { Sentry } from "~/integrations/sentry";
import { trigger, triggerResend } from "~/integrations/trigger.server";
import { formatCentsAsDollars } from "~/lib/utils";

export const donationSummaryJob = trigger.defineJob({
  id: "donation-summary",
  name: "Weekly Donation Summary",
  version: "0.0.1",
  trigger: cronTrigger({
    // Every Saturday at 3pm UTC
    cron: "0 15 * * SAT",
  }),
  integrations: {
    resend: triggerResend,
  },
  run: async (_, io) => {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const accounts = await io.runTask("get-accounts", async () => {
      return db.account.findMany({
        where: {
          subscribers: {
            some: {},
          },
          transactions: {
            some: {
              createdAt: {
                gte: sevenDaysAgo,
              },
            },
          },
        },
        select: {
          org: {
            select: {
              host: true,
              name: true,
              replyToEmail: true,
            },
          },
          code: true,
          transactions: {
            where: {
              createdAt: {
                gte: sevenDaysAgo,
              },
            },
            select: {
              amountInCents: true,
            },
          },
          subscribers: {
            select: {
              subscriber: {
                select: {
                  email: true,
                },
              },
            },
          },
        },
        orderBy: { code: "asc" },
      });
    });

    if (accounts.length === 0) {
      await io.logger.info("No emails to send. Exiting.");
      return {
        count: 0,
        success: true,
      };
    }

    const emails = accounts.map((a) => {
      const total = formatCentsAsDollars(
        a.transactions.reduce((acc, transaction) => acc + transaction.amountInCents, 0),
      );
      const to = a.subscribers.map((s) => s.subscriber.email).filter(Boolean);

      return {
        // TODO: remove once orgs are required
        from: `${a.org?.name} <${a.org?.replyToEmail ?? "no-reply"}@${a.org?.host}>`,
        to,
        subject: "Weekly Donation Summary",
        html: `Account ${a.code} has received ${total} this week. Log in to see more details.`,
      };
    });

    if (emails.length > 90) {
      await io.logger.warn(
        "Resend only supports up to 100 emails per batch. Please return to this code and add batch splitting.",
      );
    }

    try {
      await io.resend.batch.send("send-emails", [...emails]);
    } catch (error) {
      Sentry.captureException(error);
      return {
        success: false,
        error: error instanceof Error ? error.message : `Unknown error occurred. ${JSON.stringify(error)}`,
      };
    }

    return {
      success: true,
      count: emails.length,
    };
  },
});
