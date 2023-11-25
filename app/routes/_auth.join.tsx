import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Link, useSearchParams } from "@remix-run/react";
import { withZod } from "@remix-validated-form/with-zod";
import { ValidatedForm, validationError } from "remix-validated-form";
import { z } from "zod";

import { Button } from "~/components/ui/button";
import { Field } from "~/components/ui/form";
import { SubmitButton } from "~/components/ui/submit-button";
import { createUserSession, getUserId } from "~/lib/session.server";
import { safeRedirect } from "~/lib/utils";
import { createUser } from "~/models/user.server";

const validator = withZod(
  z.object({
    firstName: z.string().min(1, { message: "First name is required" }),
    lastName: z.string().optional(),
    email: z.string().min(1, { message: "Email is required" }).email(),
    password: z.string().min(8, { message: "Password must be 8 or more characters." }),
    redirectTo: z.string().optional(),
  }),
);

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const userId = await getUserId(request);
  if (userId) return redirect("/");
  return json({});
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const result = await validator.validate(await request.formData());

  if (result.error) return validationError(result.error);

  const { redirectTo, ...rest } = result.data;

  const user = await createUser({
    ...rest,
    role: "USER",
  });

  return createUserSession({
    request,
    remember: false,
    userId: user.id,
    redirectTo: safeRedirect(redirectTo, "/"),
  });
};

export const meta: MetaFunction = () => [{ title: "Sign Up" }];

export default function Join() {
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") ?? undefined;

  return (
    <div className="grid h-full place-items-center">
      <div className="max-w-lg px-8">
        <h1 className="text-4xl font-extrabold">Create an Account</h1>
        <ValidatedForm validator={validator} method="post" className="mt-8 space-y-3">
          <div className="flex w-full gap-3">
            <Field label="First Name" id="firstName" name="firstName" autoComplete="given-name" required />
            <Field label="Last Name" id="lastName" name="lastName" autoComplete="family-name" />
          </div>
          <Field label="Email" id="email" name="email" type="email" autoComplete="email" required />
          <Field label="Password" id="password" name="password" type="password" autoComplete="new-password" required />

          <input type="hidden" name="redirectTo" value={redirectTo} />
          <SubmitButton className="w-full">Create Account</SubmitButton>
        </ValidatedForm>
        <Button variant="link" asChild>
          <Link to="/login">Already have an account?</Link>
        </Button>
      </div>
    </div>
  );
}
