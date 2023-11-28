import type { Contact, PasswordReset } from "@prisma/client";

import { resend } from "~/integrations/resend.server";

export async function sendPasswordResetEmail({
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  email,
  token,
}: {
  email: NonNullable<Contact["email"]>;
  token: PasswordReset["token"];
}) {
  if (!process.env.ADMIN_URL) throw new Error("ADMIN_URL is not set");
  const url = new URL(process.env.ADMIN_URL);
  url.pathname = "/passwords/new";
  url.searchParams.set("token", token);

  try {
    const data = await resend.emails.send({
      from: "Alliance 436 <no-reply@getcosmic.dev>",
      // to: email,
      to: "paulh.morris@gmail.com",
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
