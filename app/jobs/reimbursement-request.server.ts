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
    const [reimbursementRequest, admins] = await Promise.all([
      prisma.reimbursementRequest.findUniqueOrThrow({
        where: { id: payload.reimbursementRequestId },
        include: {
          user: {
            select: {
              contact: {
                select: {
                  email: true,
                },
              },
            },
          },
        },
      }),
      prisma.user.findMany({
        where: { role: UserRole.ADMIN },
        select: {
          contact: {
            select: {
              email: true,
            },
          },
        },
      }),
    ]);
    if (admins.length === 0)
      return {
        status: "success",
        message: "No admins to notify",
      };
    const emailAddresses = admins.map((admin) => admin.contact.email);

    await io.resend.emails.send("send-email", {
      to: emailAddresses,
      subject: "New reimbursement request",
      text: `There's a new reimbursement request for ${formatCentsAsDollars(reimbursementRequest.amountInCents)} from ${
        reimbursementRequest.user.contact.email
      }, View it on your <a href="http://localhost:3000">Dashboard</a>.`,
      from: "no-reply@getcosmic.dev",
    });
  },
});
