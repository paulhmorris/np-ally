import { render } from "@react-email/render";
import { logger, task } from "@trigger.dev/sdk/v3";

import { ReimbursementRequestEmail } from "emails/reimbursement-request";
import { Bucket } from "~/integrations/bucket.server";
import { sendEmail } from "~/integrations/email.server";
import { db } from "~/integrations/prisma.server";
import { constructOrgMailFrom, constructOrgURL } from "~/lib/utils";

type Payload = {
  reimbursementRequestId: string;
};

export const reimbursementRequestJob = task({
  id: "reimbursement-request",
  run: async (payload: Payload) => {
    const rr = await db.reimbursementRequest.findUnique({
      where: { id: payload.reimbursementRequestId },
      select: {
        account: {
          select: {
            code: true,
          },
        },
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
            subdomain: true,
            replyToEmail: true,
            administratorEmail: true,
          },
        },
      },
    });

    if (!rr) {
      logger.error(`No request found with id ${payload.reimbursementRequestId}`);
      return {
        status: "error",
        message: `No request found with id ${payload.reimbursementRequestId}`,
      };
    }

    if (!rr.org || !rr.org.host || !rr.org.replyToEmail || !rr.org.administratorEmail) {
      logger.error(`No org found for request with id ${payload.reimbursementRequestId}`);
      return {
        status: "error",
        message: `No org found for request with id ${payload.reimbursementRequestId}`,
      };
    }

    // Get presigned URLs for all receipts and save them for a week
    if (!rr.receipts.length) {
      logger.info("No receipts to update");
      return;
    }

    if (
      rr.receipts.some((r) => !r.s3Url || (r.s3UrlExpiry && new Date(r.s3UrlExpiry).getTime() < new Date().getTime()))
    ) {
      const updatePromises = rr.receipts.map(async (receipt) => {
        if (!receipt.s3Url || (receipt.s3UrlExpiry && new Date(receipt.s3UrlExpiry).getTime() < new Date().getTime())) {
          logger.info(`Generating url for ${receipt.title}`);
          const url = await Bucket.getGETPresignedUrl(receipt.s3Key);
          return db.receipt.update({
            where: { id: receipt.id, orgId: rr.org?.id },
            data: { s3Url: url, s3UrlExpiry: new Date(Date.now() + 6.5 * 24 * 60 * 60 * 1000) },
          });
        }
      });

      const results = await Promise.all(updatePromises);
      logger.info(`Updated ${results.length} receipts with presigned URLs`);
      return;
    }
    logger.info("All receipts have valid presigned URLs");

    const url = constructOrgURL("/dashboards/admin", rr.org).toString();
    const { contact } = rr.user;

    await sendEmail({
      from: constructOrgMailFrom(rr.org),
      to: `${rr.org.administratorEmail}@${rr.org.host}`,
      subject: "New Reimbursement Request",
      html: render(
        <ReimbursementRequestEmail
          accountName={rr.account.code}
          amountInCents={rr.amountInCents}
          url={url}
          requesterName={`${contact.firstName} ${contact.lastName}`}
        />,
      ),
    });
  },
});
