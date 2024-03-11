import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { useSearchParams } from "@remix-run/react";
import { withZod } from "@remix-validated-form/with-zod";
import { ValidatedForm, validationError } from "remix-validated-form";
import { z } from "zod";

import { AuthCard } from "~/components/auth-card";
import { ErrorComponent } from "~/components/error-component";
import { Checkbox } from "~/components/ui/checkbox";
import { FormField } from "~/components/ui/form";
import { Label } from "~/components/ui/label";
import { SubmitButton } from "~/components/ui/submit-button";
import { Sentry } from "~/integrations/sentry";
import { toast } from "~/lib/toast.server";
import { safeRedirect } from "~/lib/utils";
import { CheckboxSchema } from "~/models/schemas";
import { verifyLogin } from "~/models/user.server";
import { SessionService } from "~/services/SessionService.server";

const validator = withZod(
  z.object({
    email: z.string().min(1, { message: "Email is required" }).email(),
    password: z.string().min(8, { message: "Password must be 8 or more characters." }),
    remember: CheckboxSchema,
    redirectTo: z.string().optional(),
  }),
);

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const userId = await SessionService.getUserId(request);
  if (userId) return redirect("/");
  return json({});
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const result = await validator.validate(await request.formData());

  if (result.error) {
    return validationError(result.error);
  }

  const { email, password, remember, redirectTo } = result.data;
  const user = await verifyLogin(email, password);

  if (!user) {
    return validationError({
      fieldErrors: {
        email: "Email or password is incorrect",
      },
    });
  }

  if (user.memberships.length === 0) {
    return toast.json(
      request,
      { message: "You are not a member of any organizations. Please contact your administrator." },
      {
        title: "Error",
        type: "error",
        description: "You are not a member of any organizations. Please contact your administrator.",
      },
    );
  }

  Sentry.setUser({ id: user.id, email: user.username });

  // If the user has a default membership or only one org, we can just log them in to that org
  const defaultMembership = user.memberships.find((m) => m.isDefault);
  if (user.memberships.length === 1 || defaultMembership) {
    return SessionService.createUserSession({
      request,
      userId: user.id,
      orgId: defaultMembership?.orgId ?? user.memberships[0].orgId,
      redirectTo: safeRedirect(redirectTo, "/"),
      remember: !!remember,
    });
  }

  // Users who are in multiple organizations need to choose which one to log in to
  const url = new URL(request.url);
  const redirectUrl = new URL("/choose-org", url.origin);
  if (redirectTo) {
    redirectUrl.searchParams.set("redirectTo", redirectTo);
  }

  // Log the user in but require them to choose an organization
  return SessionService.createUserSession({
    request,
    userId: user.id,
    redirectTo: redirectUrl.toString(),
    remember: !!remember,
  });
};

export const meta: MetaFunction = () => [{ title: "Login" }];

export default function LoginPage() {
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") || "/";

  return (
    <AuthCard>
      <h1 className="text-4xl font-extrabold">Login</h1>
      <ValidatedForm validator={validator} method="post" className="mt-4 space-y-4">
        <FormField
          label="Email"
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          defaultValue={process.env.NODE_ENV === "development" ? "paul@remix.run" : undefined}
        />
        <FormField
          label="Password"
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          defaultValue={process.env.NODE_ENV === "development" ? "password" : undefined}
          required
        />

        <input type="hidden" name="redirectTo" value={redirectTo} />
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Checkbox id="remember" name="remember" aria-label="Remember this device for 7 days" />
            <Label htmlFor="remember" className="cursor-pointer">
              Remember this device for 7 days
            </Label>
          </div>
        </div>
        <SubmitButton className="w-full">Log in</SubmitButton>
      </ValidatedForm>
    </AuthCard>
  );
}

export function ErrorBoundary() {
  return <ErrorComponent />;
}
