import { UserRole } from "@prisma/client";
import { invokeTrigger } from "@trigger.dev/sdk";
import { z } from "zod";

import { prisma } from "~/integrations/prisma.server";
import { trigger, triggerResend } from "~/integrations/trigger.server";
import { formatCentsAsDollars } from "~/lib/utils";

export const reimbursementRequestJob = trigger.defineJob({
  id: "reimbursement-request",
  name: "Notify admins of new reimbursement request",
  version: "0.0.1",
  trigger: invokeTrigger({
    schema: z.object({
      reimbursementRequestId: z.string(),
    }),
  }),
  integrations: { resend: triggerResend },
  run: async (payload, io) => {
    const request = await io.runTask("get-requests", async () => {
      return prisma.reimbursementRequest.findUnique({
        where: { id: payload.reimbursementRequestId },
        select: {
          amountInCents: true,
          user: {
            select: {
              contact: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
        },
      });
    });

    if (!request) {
      await io.logger.error(`No request found with id ${payload.reimbursementRequestId}`);
      return {
        status: "error",
        message: `No request found with id ${payload.reimbursementRequestId}`,
      };
    }

    const admins = await io.runTask("get-admins", async () => {
      return prisma.user.findMany({
        where: { role: UserRole.ADMIN },
        select: {
          contact: {
            select: {
              email: true,
            },
          },
        },
      });
    });

    if (admins.length === 0) {
      await io.logger.info("No admins to notify. Exiting.");
      return {
        status: "success",
        message: "No admins to notify",
      };
    }

    const emailAddresses = admins.map((admin) => admin.contact.email).filter(Boolean);
    const url = new URL("/dashboards/admin", process.env.SITE_URL ?? `https://${process.env.VERCEL_URL}`);
    const { contact } = request.user;

    await io.resend.emails.send("send-email", {
      from: "Alliance 436 <no-reply@alliance436.org>",
      to: emailAddresses,
      subject: "New Reimbursement Request",
      text: `There's a new reimbursement request for ${formatCentsAsDollars(request.amountInCents)} from ${
        contact.firstName
      } ${contact.lastName}, View it on your <a href="${url.toString()}">Dashboard</a>.`,
    });
  },
});
