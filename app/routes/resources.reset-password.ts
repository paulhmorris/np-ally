import type { ActionFunctionArgs } from "@remix-run/node";
import { withZod } from "@remix-validated-form/with-zod";
import dayjs from "dayjs";
import { typedjson } from "remix-typedjson";
import { validationError } from "remix-validated-form";
import { z } from "zod";

import { Sentry } from "~/integrations/sentry";
import { toast } from "~/lib/toast.server";
import { deletePasswordReset } from "~/models/password_reset.server";
import { MailService } from "~/services/MailService.server";
import { PasswordService } from "~/services/PasswordService.server";
import { UserService } from "~/services/UserService.server";

const validator = withZod(z.object({ username: z.string().email() }));

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== "POST") {
    return typedjson({ status: 405 });
  }

  const result = await validator.validate(await request.formData());
  if (result.error) {
    return validationError(result.error);
  }

  const user = await UserService.getUserByUsername(result.data.username);
  if (!user) {
    return toast.json(
      request,
      { message: "User not found" },
      {
        variant: "destructive",
        title: "User not found",
        description: `There is no user with username ${result.data.username}.`,
      },
    );
  }

  const existingReset = await PasswordService.getPasswordResetByUserId(user.id);
  if (existingReset) {
    return toast.json(
      request,
      { message: "User not found" },
      {
        variant: "warning",
        title: "Existing request found",
        description: `A password reset request has already been sent. It expires in ${dayjs(
          existingReset.expiresAt,
        ).diff(dayjs(), "minutes")} minutes.`,
      },
    );
  }

  const reset = await PasswordService.generatePasswordReset(user.username);
  const { data, error } = await MailService.sendPasswordSetupEmail({ email: user.username, token: reset.token });

  // Unknown Resend error
  if (error || !data) {
    Sentry.captureException(error);
    await deletePasswordReset({ token: reset.token });
    return toast.json(
      request,
      { error },
      {
        variant: "destructive",
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
        variant: "destructive",
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
      variant: "default",
      title: "Email sent",
      description: "Check the email for a link to reset the password.",
    },
  );
}
