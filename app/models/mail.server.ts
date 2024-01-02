import type { Contact, PasswordReset } from "@prisma/client";

import { resend } from "~/integrations/resend.server";

export async function sendPasswordResetEmail({
  email,
  token,
}: {
  email: NonNullable<Contact["email"]>;
  token: PasswordReset["token"];
}) {
  const url = new URL(process.env.SITE_URL ?? `https://${process.env.VERCEL_URL}`);
  url.pathname = "/passwords/new";
  url.searchParams.set("token", token);
  url.searchParams.set("isReset", "true");

  try {
    const data = await resend.emails.send({
      from: "Alliance 436 <alliance-436@alliance436.org>",
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
    return { error };
  }
}

export async function sendPasswordSetupEmail({
  email,
  token,
}: {
  email: NonNullable<Contact["email"]>;
  token: PasswordReset["token"];
}) {
  const url = new URL(process.env.SITE_URL ?? `https://${process.env.VERCEL_URL}`);
  url.pathname = "/passwords/new";
  url.searchParams.set("token", token);

  try {
    const data = await resend.emails.send({
      from: "Alliance 436 <alliance-436@alliance436.org>",
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
    return { error };
  }
}
