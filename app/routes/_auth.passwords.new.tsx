import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { useSearchParams } from "@remix-run/react";
import { withZod } from "@remix-validated-form/with-zod";
import { ValidatedForm, validationError } from "remix-validated-form";
import { z } from "zod";

import { ErrorComponent } from "~/components/error-component";
import { FormField } from "~/components/ui/form";
import { SubmitButton } from "~/components/ui/submit-button";
import { badRequest, unauthorized } from "~/lib/responses.server";
import { getSession, sessionStorage } from "~/lib/session.server";
import { toast } from "~/lib/toast.server";
import { getSearchParam } from "~/lib/utils";
import { expirePasswordReset, getPasswordResetByToken } from "~/models/password_reset.server";
import { getUserById, resetUserPassword, verifyLogin } from "~/models/user.server";

const validator = withZod(
  z
    .object({
      token: z.string(),
      oldPassword: z.string().min(8, "Password must be at least 8 characters"),
      newPassword: z.string().min(8, "Password must be at least 8 characters"),
      confirmation: z.string().min(8, "Password must be at least 8 characters"),
    })
    .superRefine(({ newPassword, confirmation }, ctx) => {
      if (newPassword !== confirmation) {
        ctx.addIssue({
          code: "custom",
          message: "Passwords must match",
          path: ["confirmation"],
        });
      }
    }),
);

export async function loader({ request }: LoaderFunctionArgs) {
  const session = await getSession(request);
  const token = getSearchParam("token", request);
  if (!token) {
    throw unauthorized("No token provided");
  }

  const reset = await getPasswordResetByToken({ token });
  if (!reset || reset.expiresAt < new Date()) {
    throw badRequest("Invalid token");
  }

  return new Response(null, {
    headers: {
      "Set-Cookie": await sessionStorage.destroySession(session),
    },
  });
}

export async function action({ request }: ActionFunctionArgs) {
  const tokenParam = getSearchParam("token", request);

  // Validate form
  const result = await validator.validate(await request.formData());
  if (result.error) {
    return validationError(result.error);
  }

  // Check token
  const { oldPassword, newPassword, token } = result.data;
  const reset = await getPasswordResetByToken({ token });
  if (!reset) {
    return toast.json(
      request,
      {},
      { variant: "destructive", title: "Token not found", description: "Please try again." },
    );
  }

  // Check expiration
  if (reset.expiresAt < new Date()) {
    return toast.json(
      request,
      {},
      { variant: "destructive", title: "Token expired", description: "Please try again." },
    );
  }

  // Check token against param
  if (token !== tokenParam) {
    return toast.json(
      request,
      { success: false },
      { variant: "destructive", title: "Invalid token", description: "Please try again." },
    );
  }

  // Check user
  const userFromToken = await getUserById(reset.userId);
  if (!userFromToken) {
    return toast.json(
      request,
      { success: false },
      { variant: "destructive", title: "User not found", description: "Please try again." },
    );
  }

  // Check old password is correct
  const user = await verifyLogin(userFromToken.contact.email, oldPassword);
  if (!user) {
    return validationError({
      fieldErrors: {
        oldPassword: "Incorrect password",
      },
    });
  }

  // Reset password
  await resetUserPassword({ userId: user.id, password: newPassword });

  // Use token
  await expirePasswordReset({ token });

  return toast.redirect(request, "/login", {
    variant: "default",
    title: "Password reset",
    description: "Your password has been reset. Login with your new password.",
  });
}

export default function NewPassword() {
  const [searchParams] = useSearchParams();

  return (
    <div className="grid h-full place-items-center">
      <div className="max-w-lg px-8">
        <h1 className="text-4xl font-extrabold">Set a new password.</h1>
        <ValidatedForm validator={validator} method="post" className="mt-4 space-y-3">
          <input type="hidden" name="token" value={searchParams.get("token") ?? ""} />
          <FormField label="Old password" name="oldPassword" type="password" autoComplete="current-password" required />
          <FormField label="New Password" name="newPassword" type="password" autoComplete="new-password" required />
          <FormField
            label="Confirm New Password"
            name="confirmation"
            type="password"
            autoComplete="new-password"
            required
          />
          <SubmitButton>Reset Password</SubmitButton>
        </ValidatedForm>
      </div>
    </div>
  );
}

export function ErrorBoundary() {
  return <ErrorComponent />;
}
