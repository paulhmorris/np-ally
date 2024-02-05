import { ActionFunctionArgs } from "@remix-run/node";
import { withZod } from "@remix-validated-form/with-zod";
import { typedjson } from "remix-typedjson";
import { validationError } from "remix-validated-form";
import { z } from "zod";
import { zfd } from "zod-form-data";

import { toast } from "~/lib/toast.server";
import { MailService } from "~/services/MailService.server";
import { SessionService } from "~/services/SessionService.server";

export const validator = withZod(
  z.object({
    name: z.string().trim(),
    method: z.string(),
    otherMethod: z.string().optional(),
    email: zfd.text(z.string().email({ message: "Invalid email address" }).optional()),
    phone: zfd.text(
      z
        .string()
        .transform((val) => val.replace(/\D/g, ""))
        .pipe(z.string().length(10, { message: "Invalid phone number" }))
        .optional(),
    ),
    message: z.string().max(1000),
  }),
);

export async function action({ request }: ActionFunctionArgs) {
  const user = await SessionService.requireUser(request);

  if (request.method !== "POST") {
    throw typedjson({ success: false, message: "Method Not Allowed" }, { status: 405 });
  }

  const result = await validator.validate(await request.formData());
  if (result.error) {
    return validationError(result.error);
  }

  const { name, email, phone, message, method, otherMethod } = result.data;

  if (method === "Other" && (!otherMethod || otherMethod === "")) {
    return validationError({
      fieldErrors: {
        otherMethod: "This field is required",
      },
      ...result.data,
    });
  }

  const { data, error } = await MailService.sendEmail({
    from: "Alliance 436 <no-reply@alliance436.org>",
    to: "accounts@alliance436.org",
    subject: "New Inquiry",
    html: `
      <p>Hi there, there's a new inquiry from ${user.username}:</p>
      <br />
      <p>Name: ${name}</p>
      <p>Preferred contact method: ${method}</p>
      ${email ? `<p>Email: ${email}</p>` : ""}
      ${phone ? `<p>Phone: ${phone}</p>` : ""}
      <p>Message: ${message}</p>
    `,
  });

  if (error) {
    return toast.json(
      request,
      { success: false, message: JSON.stringify(error) },
      { type: "error", title: "Error sending email", description: "Please try again" },
      { status: 500 },
    );
  }

  return toast.json(
    request,
    { success: true, emailId: data?.data?.id },
    { type: "success", title: "Inquiry sent", description: "We'll be in touch soon!" },
  );
}
