import { render } from "@react-email/render";
import { logger, task } from "@trigger.dev/sdk/v3";

import { IncomeNotificationEmail } from "emails/income-notification";
import { sendEmail } from "~/integrations/email.server";
import { db } from "~/integrations/prisma.server";
import { constructOrgMailFrom, constructOrgURL } from "~/lib/utils";

type Payload = {
  to: string;
  accountName: string;
  amountInCents: number;
  orgId: string;
};

export const notifySubscribersJob = task({
  id: "notify-user-income",
  run: async (payload: Payload) => {
    const org = await db.organization.findUnique({
      where: { id: payload.orgId },
      select: {
        name: true,
        host: true,
        subdomain: true,
        replyToEmail: true,
      },
    });

    if (!org || !org.host || !org.replyToEmail) {
      logger.error(`No organization found with id ${payload.orgId}`);
      return {
        status: "error",
        message: `No organization found with id ${payload.orgId}`,
      };
    }

    const user = await db.user.findUnique({
      where: { username: payload.to },
      select: {
        contact: {
          select: {
            firstName: true,
          },
        },
      },
    });

    if (!user) {
      logger.error(`No user found with username ${payload.to}`);
      return {
        status: "error",
        message: `No user found with username ${payload.to}`,
      };
    }

    const url = constructOrgURL("/", org).toString();
    await sendEmail({
      from: constructOrgMailFrom(org),
      to: payload.to,
      subject: "You have new income!",
      html: render(
        <IncomeNotificationEmail
          url={url}
          accountName={payload.accountName}
          amountInCents={payload.amountInCents}
          userFirstname={user.contact.firstName}
        />,
      ),
    });
  },
});
