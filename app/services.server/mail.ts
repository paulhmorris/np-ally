import type { Contact, Organization, PasswordReset, ReimbursementRequestStatus } from "@prisma/client";

import { db } from "~/integrations/prisma.server";
import { resend } from "~/integrations/resend.server";
import { Sentry } from "~/integrations/sentry";
import { capitalize } from "~/lib/utils";

export type CreateEmailOptions = Parameters<typeof resend.emails.send>[0];
export type CreateEmailRequestOptions = Parameters<typeof resend.emails.send>[1];

export const MailService = {
  sendEmail: async function (payload: CreateEmailOptions, options?: CreateEmailRequestOptions) {
    try {
      const data = await resend.emails.send(payload, options);
      return { data };
    } catch (error) {
      Sentry.captureException(error);
      return { error };
    }
  },

  sendPasswordResetEmail: async function ({
    email,
    token,
    orgId,
  }: {
    email: NonNullable<Contact["email"]>;
    token: PasswordReset["token"];
    orgId: Organization["id"];
  }) {
    const org = await db.organization.findUniqueOrThrow({ where: { id: orgId } });
    const url = new URL("/passwords/new", `https://${org.host}`);
    url.searchParams.set("token", token);
    url.searchParams.set("isReset", "true");

    try {
      const data = await resend.emails.send({
        from: `${org.name} <no-reply@${org.host}>`,
        to: email,
        subject: "Reset Your Password",
        html: `
          <p>Hi there,</p>
          <p>Someone requested a password reset for your ${org.name} account. If this was you, please click the link below to reset your password. The link will expire in 15 minutes.</p>
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
    orgId,
  }: {
    email: NonNullable<Contact["email"]>;
    token: PasswordReset["token"];
    orgId: Organization["id"];
  }) {
    const org = await db.organization.findUniqueOrThrow({ where: { id: orgId } });
    const url = new URL("/passwords/new", `https://${org.host}`);
    url.searchParams.set("token", token);

    try {
      const data = await resend.emails.send({
        from: `${org.name} <no-reply@${org.host}>`,
        to: email,
        subject: "Setup Your Password",
        html: `
          <p>Hi there,</p>
          <p>Someone created an ${org.name} account for you. Click the link below to setup a password. The link will expire in 15 minutes.</p>
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
    orgId,
    note,
  }: {
    email: NonNullable<Contact["email"]>;
    status: ReimbursementRequestStatus;
    orgId: Organization["id"];
    note?: string;
  }) {
    try {
      const org = await db.organization.findUniqueOrThrow({ where: { id: orgId } });
      const data = await resend.emails.send({
        from: `${org.name} <no-reply@${org.host}>`,
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
