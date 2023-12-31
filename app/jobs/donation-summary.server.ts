import { cronTrigger } from "@trigger.dev/sdk";

import { prisma } from "~/integrations/prisma.server";
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
      return prisma.account.findMany({
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
      });
    });

    if (accounts.length === 0) {
      await io.logger.info("No emails to send. Exiting.");
    }

    const emails = accounts.map((a) => {
      const totalInCents = a.transactions.reduce((acc, transaction) => acc + transaction.amountInCents, 0);

      return {
        from: "Alliance 436 <no-reply@alliance436.org>",
        to: a.subscribers.map((s) => s.subscriber.email),
        subject: "Weekly Donation summary",
        html: `Account ${a.code} has received ${formatCentsAsDollars(
          totalInCents,
        )} this week. Log in to see more details.`,
      };
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
