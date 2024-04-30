import type { ActionFunctionArgs } from "@remix-run/node";
import { withZod } from "@remix-validated-form/with-zod";
import dayjs from "dayjs";
import { typedjson } from "remix-typedjson";
import { validationError } from "remix-validated-form";
import { z } from "zod";

import { db } from "~/integrations/prisma.server";
import { Sentry } from "~/integrations/sentry";
import { toast } from "~/lib/toast.server";
import { sendPasswordResetEmail, sendPasswordSetupEmail } from "~/services.server/mail";
import { deletePasswordReset, generatePasswordReset, getPasswordResetByUserId } from "~/services.server/password";

export const passwordResetValidator = withZod(
  z.object({
    username: z.string().email(),
    _action: z.enum(["reset", "setup"]),
  }),
);

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== "POST") {
    return typedjson({ status: 405 });
  }

  const url = new URL(request.url);
  const host = url.hostname.split(".").slice(-2).join(".");
  let org = await db.organization.findUnique({ where: { host } });

  // If the reset is initiated from a non-org domain, use backup NP Ally Org
  if (!org) {
    org = await db.organization.findUniqueOrThrow({ where: { host: "np-ally.com" } });
  }

  const result = await passwordResetValidator.validate(await request.formData());
  if (result.error) {
    return validationError(result.error);
  }

  const user = await db.user.findUnique({ where: { username: result.data.username } });
  if (!user) {
    return toast.json(
      request,
      { message: "User not found" },
      {
        type: "error",
        title: "User not found",
        description: `There is no user with username ${result.data.username}.`,
      },
    );
  }

  const existingReset = await getPasswordResetByUserId(user.id);
  if (existingReset) {
    return toast.json(
      request,
      { message: "Existing request found" },
      {
        type: "warning",
        title: "Existing request found",
        description: `A password reset request has already been sent. It expires in ${dayjs(
          existingReset.expiresAt,
        ).diff(dayjs(), "minutes")} minutes.`,
      },
    );
  }

  const reset = await generatePasswordReset(user.username);
  const { data, error } =
    result.data._action === "setup"
      ? await sendPasswordSetupEmail({ email: user.username, token: reset.token, orgId: org.id })
      : await sendPasswordResetEmail({ email: user.username, token: reset.token, orgId: org.id });

  // Unknown Resend error
  if (error || !data) {
    Sentry.captureException(error);
    await deletePasswordReset(reset.token);
    return toast.json(
      request,
      { error },
      {
        type: "error",
        title: "Something went wrong",
        description: "There was an error sending the password reset email.",
      },
    );
  }

  // Email not sent
  if ("statusCode" in data && data.statusCode !== 200) {
    // Delete the reset if there was an error emailing the user
    await deletePasswordReset(reset.id);
    return toast.json(
      request,
      { data },
      {
        type: "error",
        title: "Something went wrong",
        description: "There was an error sending the password reset email.",
      },
    );
  }

  // Success
  return toast.json(
    request,
    { data },
    {
      type: "success",
      title: "Email sent",
      description: "Check the email for a link to set the password.",
    },
  );
}
