import type { Contact, PasswordReset, ReimbursementRequestStatus } from "@prisma/client";

import { resend } from "~/integrations/resend.server";
import { Sentry } from "~/integrations/sentry";
import { capitalize } from "~/lib/utils";

export const MailService = {
  sendPasswordResetEmail: async function ({
    email,
    token,
  }: {
    email: NonNullable<Contact["email"]>;
    token: PasswordReset["token"];
  }) {
    const url = new URL("/passwords/new", process.env.SITE_URL ?? `https://${process.env.VERCEL_URL}`);
    url.searchParams.set("token", token);
    url.searchParams.set("isReset", "true");

    try {
      const data = await resend.emails.send({
        from: "Alliance 436 <no-reply@alliance436.org>",
        to: email,
        subject: "Reset Your Password",
        html: `
          <p>Hi there,</p>
          <p>Someone requested a password reset for your Alliance 436 account. If this was you, please click the link below to reset your password. The link will expire in 15 minutes.</p>
          <p><a style="color:#976bff" href="${url.toString()}" target="_blank">Reset Password</a></p>
          <p>If you did not request a password reset, you can safely ignore this email.</p>
          `,
      });
      return { data };
    } catch (error) {
      Sentry.captureException(error);
      return { error };
    }
  },

  sendPasswordSetupEmail: async function ({
    email,
    token,
  }: {
    email: NonNullable<Contact["email"]>;
    token: PasswordReset["token"];
  }) {
    const url = new URL("/passwords/new", process.env.SITE_URL ?? `https://${process.env.VERCEL_URL}`);
    url.searchParams.set("token", token);

    try {
      const data = await resend.emails.send({
        from: "Alliance 436 <no-reply@alliance436.org>",
        to: email,
        subject: "Setup Your Password",
        html: `
          <p>Hi there,</p>
          <p>Someone created an Alliance 436 account for you. Click the link below to setup a password. The link will expire in 15 minutes.</p>
          <p><a style="color:#976bff" href="${url.toString()}" target="_blank">Setup Password</a></p>
       `,
      });
      return { data };
    } catch (error) {
      Sentry.captureException(error);
      return { error };
    }
  },

  sendReimbursementRequestUpdateEmail: async function ({
    email,
    status,
    note,
  }: {
    email: NonNullable<Contact["email"]>;
    status: ReimbursementRequestStatus;
    note?: string;
  }) {
    try {
      const data = await resend.emails.send({
        from: "Alliance 436 <no-reply@alliance436.org>",
        to: email,
        subject: `Reimbursement Request ${capitalize(status)}`,
        html: `
          <p>Hi there,</p>
          <p>Your reimbursement request has been ${capitalize(status)}.</p>
          ${note ? `<p>Administrator note: ${note}</p>` : ""}
        `,
      });
      return { data };
    } catch (error) {
      Sentry.captureException(error);
      return { error };
    }
  },
};
