import { useFetcher } from "@remix-run/react";
import { withZod } from "@remix-validated-form/with-zod";
import { ValidatedForm } from "remix-validated-form";
import { z } from "zod";

import { Field } from "~/components/ui/form";
import { SubmitButton } from "~/components/ui/submit-button";

const validator = withZod(z.object({ email: z.string().email() }));

export default function ResetPassword() {
  const fetcher = useFetcher();
  return (
    <div className="grid h-full place-items-center">
      <div className="max-w-lg px-8">
        <h1 className="text-4xl font-extrabold">Reset your password.</h1>
        <ValidatedForm fetcher={fetcher} validator={validator} method="post" action="/reset-password" className="mt-4 space-y-3">
          <Field label="Email" name="email" type="email" autoComplete="username" required />
          <SubmitButton>Get Reset Link</SubmitButton>
        </ValidatedForm>
      </div>
    </div>
  );
}
