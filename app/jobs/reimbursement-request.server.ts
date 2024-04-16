import { invokeTrigger } from "@trigger.dev/sdk";
import { z } from "zod";

import { Bucket } from "~/integrations/bucket.server";
import { db } from "~/integrations/prisma.server";
import { trigger, triggerResend } from "~/integrations/trigger.server";
import { formatCentsAsDollars } from "~/lib/utils";

export const reimbursementRequestJob = trigger.defineJob({
  id: "reimbursement-request",
  name: "New Reimbursement Request",
  version: "0.0.2",
  trigger: invokeTrigger({
    schema: z.object({
      reimbursementRequestId: z.string(),
    }),
  }),
  integrations: { resend: triggerResend },
  run: async (payload, io) => {
    const rr = await io.runTask("get-request", async () => {
      return db.reimbursementRequest.findUnique({
        where: { id: payload.reimbursementRequestId },
        select: {
          receipts: true,
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
              id: true,
              name: true,
              host: true,
              replyToEmail: true,
              administratorEmail: true,
            },
          },
        },
      });
    });

    if (!rr) {
      await io.logger.error(`No request found with id ${payload.reimbursementRequestId}`);
      return {
        status: "error",
        message: `No request found with id ${payload.reimbursementRequestId}`,
      };
    }

    if (!rr.org || !rr.org.host || !rr.org.replyToEmail || !rr.org.administratorEmail) {
      await io.logger.error(`No org found for request with id ${payload.reimbursementRequestId}`);
      return {
        status: "error",
        message: `No org found for request with id ${payload.reimbursementRequestId}`,
      };
    }

    // Get presigned URLs for all receipts and save them for a week
    await io.runTask("save presigned urls", async () => {
      if (
        rr.receipts.some((r) => !r.s3Url || (r.s3UrlExpiry && new Date(r.s3UrlExpiry).getTime() < new Date().getTime()))
      ) {
        const updatePromises = rr.receipts.map(async (receipt) => {
          if (
            !receipt.s3Url ||
            (receipt.s3UrlExpiry && new Date(receipt.s3UrlExpiry).getTime() < new Date().getTime())
          ) {
            console.info(`Generating url for ${receipt.title}`);
            const url = await Bucket.getGETPresignedUrl(receipt.s3Key);
            return db.receipt.update({
              where: { id: receipt.id, orgId: rr.org?.id },
              data: { s3Url: url, s3UrlExpiry: new Date(Date.now() + 6.5 * 24 * 60 * 60 * 1000) },
            });
          }
        });

        const results = await Promise.all(updatePromises);
        await io.logger.info(`Updated ${results.length} receipts with presigned URLs`);
        return;
      }
      await io.logger.info("All receipts have valid presigned URLs");
    });

    const url = new URL("/dashboards/admin", `https://${rr.org.host}`);
    const { contact } = rr.user;

    await io.resend.emails.send("send-email", {
      from: `${rr.org.name} <${rr.org.replyToEmail}@${rr.org.host}>`,
      to: `${rr.org.administratorEmail}@${rr.org.host}`,
      subject: "New Reimbursement Request",
      html: `There's a new reimbursement request for ${formatCentsAsDollars(rr.amountInCents)} from ${
        contact.firstName
      } ${contact.lastName}, View it on the <a href="${url.toString()}">Dashboard</a>.`,
    });
  },
});
