import type { ActionFunctionArgs } from "@remix-run/node";
import { withZod } from "@remix-validated-form/with-zod";
import dayjs from "dayjs";
import { typedjson } from "remix-typedjson";
import { validationError } from "remix-validated-form";
import { z } from "zod";

import { Sentry } from "~/integrations/sentry";
import { toast } from "~/lib/toast.server";
import { MailService } from "~/services/MailService.server";
import { PasswordService } from "~/services/PasswordService.server";
import { UserService } from "~/services/UserService.server";

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

  const result = await passwordResetValidator.validate(await request.formData());
  if (result.error) {
    return validationError(result.error);
  }

  const user = await UserService.getUserByUsername(result.data.username);
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

  const existingReset = await PasswordService.getPasswordResetByUserId(user.id);
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

  const reset = await PasswordService.generatePasswordReset(user.username);
  const { data, error } =
    result.data._action === "setup"
      ? await MailService.sendPasswordSetupEmail({ email: user.username, token: reset.token })
      : await MailService.sendPasswordResetEmail({ email: user.username, token: reset.token });

  // Unknown Resend error
  if (error || !data) {
    Sentry.captureException(error);
    await PasswordService.deletePasswordReset(reset.id);
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
    await PasswordService.deletePasswordReset(reset.id);
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
