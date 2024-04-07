import { invokeTrigger } from "@trigger.dev/sdk";
import { z } from "zod";

import { db } from "~/integrations/prisma.server";
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
    const request = await io.runTask("get-request", async () => {
      return db.reimbursementRequest.findUnique({
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
          org: {
            select: {
              name: true,
              host: true,
              replyToEmail: true,
              administratorEmail: true,
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

    if (!request.org || !request.org.host || !request.org.replyToEmail || !request.org.administratorEmail) {
      await io.logger.error(`No org found for request with id ${payload.reimbursementRequestId}`);
      return {
        status: "error",
        message: `No org found for request with id ${payload.reimbursementRequestId}`,
      };
    }

    const url = new URL("/dashboards/admin", `https://${request.org.host}`);
    const { contact } = request.user;

    await io.resend.emails.send("send-email", {
      from: `${request.org.name} <${request.org.replyToEmail}@${request.org.host}>`,
      to: `${request.org.administratorEmail}@${request.org.host}`,
      subject: "New Reimbursement Request",
      html: `There's a new reimbursement request for ${formatCentsAsDollars(request.amountInCents)} from ${
        contact.firstName
      } ${contact.lastName}, View it on the <a href="${url.toString()}">Dashboard</a>.`,
    });
  },
});
