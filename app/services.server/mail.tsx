import type { Organization, PasswordReset, ReimbursementRequestStatus, User } from "@prisma/client";
import { render } from "@react-email/render";

import { PasswordResetEmail } from "emails/password-reset";
import ReimbursementRequestUpdateEmail from "emails/reimbursement-request-update";
import { sendEmail } from "~/integrations/email.server";
import { db } from "~/integrations/prisma.server";
import { resend } from "~/integrations/resend.server";
import { Sentry } from "~/integrations/sentry";
import { capitalize } from "~/lib/utils";

import { WelcomeEmail } from "../../emails/welcome";

export type CreateEmailOptions = Parameters<typeof resend.emails.send>[0];
export type CreateEmailRequestOptions = Parameters<typeof resend.emails.send>[1];
type OrgId = Organization["id"];

export async function sendPasswordResetEmail({
  email,
  token,
  orgId,
}: {
  email: User["username"];
  token: PasswordReset["token"];
  orgId: OrgId;
}) {
  const org = await db.organization.findUniqueOrThrow({ where: { id: orgId } });
  const url = new URL("/passwords/new", `https://${org.subdomain ? org.subdomain + "." : ""}${org.host}`);
  url.searchParams.set("token", token);
  url.searchParams.set("isReset", "true");

  const html = render(<PasswordResetEmail url={url.toString()} />);

  try {
    const data = await sendEmail({
      from: `${org.name} <${org.replyToEmail}@${org.host}>`,
      to: email,
      subject: "Reset Your Password",
      html,
    });
    return { data };
  } catch (error) {
    Sentry.captureException(error);
    return { error };
  }
}

export async function sendPasswordSetupEmail({
  email,
  token,
  orgId,
}: {
  email: User["username"];
  token: PasswordReset["token"];
  orgId: OrgId;
}) {
  const org = await db.organization.findUniqueOrThrow({ where: { id: orgId } });
  const user = await db.user.findUniqueOrThrow({
    where: { username: email },
    select: { contact: { select: { firstName: true } } },
  });
  const url = new URL("/passwords/new", `https://${org.subdomain ? org.subdomain + "." : ""}${org.host}`);
  url.searchParams.set("token", token);

  const html = render(<WelcomeEmail userFirstname={user.contact.firstName} orgName={org.name} url={url.toString()} />);

  try {
    const data = await sendEmail({
      from: `${org.name} <${org.replyToEmail}@${org.host}>`,
      to: email,
      subject: "Setup Your Password",
      html,
    });
    return { data };
  } catch (error) {
    Sentry.captureException(error);
    return { error };
  }
}

export async function sendReimbursementRequestUpdateEmail({
  email,
  status,
  orgId,
  note,
}: {
  email: User["username"];
  status: ReimbursementRequestStatus;
  orgId: OrgId;
  note?: string;
}) {
  try {
    const org = await db.organization.findUniqueOrThrow({ where: { id: orgId } });
    const url = new URL("/", `https://${org.subdomain ? org.subdomain + "." : ""}${org.host}`).toString();
    const html = render(<ReimbursementRequestUpdateEmail status={status} note={note} url={url} />);

    const data = await sendEmail({
      from: `${org.name} <${org.replyToEmail}@${org.host}>`,
      to: email,
      subject: `Reimbursement Request ${capitalize(status)}`,
      html,
    });
    return { data };
  } catch (error) {
    Sentry.captureException(error);
    return { error };
  }
}
