import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { useSearchParams } from "@remix-run/react";
import { withZod } from "@remix-validated-form/with-zod";
import { ValidatedForm, validationError } from "remix-validated-form";
import { z } from "zod";

import { AuthCard } from "~/components/auth/auth-card";
import { ErrorComponent } from "~/components/error-component";
import { FormField } from "~/components/ui/form";
import { SubmitButton } from "~/components/ui/submit-button";
import { Toasts } from "~/lib/toast.server";
import { generateVerificationCode, verifyLogin } from "~/services.server/auth";
import { SessionService } from "~/services.server/session";

const validator = withZod(
  z.object({
    email: z.string().min(1, { message: "Email is required" }).email(),
    password: z.string().min(8, { message: "Password must be 8 or more characters." }),
    redirectTo: z.string().optional(),
  }),
);

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const user = await SessionService.getUser(request);
  const orgId = await SessionService.getOrgId(request);

  if (user && orgId) {
    return redirect("/");
  }

  return json({});
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const result = await validator.validate(await request.formData());

  if (result.error) {
    return validationError(result.error);
  }

  const { email, password, redirectTo } = result.data;
  const user = await verifyLogin({ username: email, password });

  if (!user) {
    return validationError({
      fieldErrors: {
        email: "Email or password is incorrect",
      },
    });
  }

  if (user.lockoutExpiration && user.lockoutExpiration > new Date()) {
    return validationError({
      fieldErrors: {
        email: "Your account is locked. Please try again in 15 minutes.",
      },
    });
  }

  if (user.memberships.length === 0) {
    return Toasts.jsonWithError(
      { message: "You are not a member of any organizations. Please contact your administrator." },
      {
        title: "Error",
        description: "You are not a member of any organizations. Please contact your administrator.",
      },
    );
  }

  await generateVerificationCode(user.id);
  const url = new URL("/login/verify", request.url);
  url.searchParams.set("email", email);
  url.searchParams.set("redirectTo", redirectTo || "/");
  return redirect(url.toString());
};

export const meta: MetaFunction = () => [{ title: "Login" }];

export default function LoginPage() {
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") || "/";

  return (
    <AuthCard>
      <h1 className="text-3xl font-extrabold">Login</h1>
      <ValidatedForm validator={validator} method="post" className="mt-4 space-y-4">
        <FormField
          label="Email"
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          defaultValue={process.env.NODE_ENV === "development" ? "paulh.morris@gmail.com" : ""}
          required
        />
        <FormField
          label="Password"
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          defaultValue={process.env.NODE_ENV === "development" ? "password" : ""}
          required
        />

        <input type="hidden" name="redirectTo" value={redirectTo} />
        <SubmitButton className="w-full">Log in</SubmitButton>
      </ValidatedForm>
    </AuthCard>
  );
}

export function ErrorBoundary() {
  return <ErrorComponent />;
}
