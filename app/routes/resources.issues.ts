import { ActionFunctionArgs } from "@remix-run/node";
import { withZod } from "@remix-validated-form/with-zod";
import { validationError } from "remix-validated-form";
import { z } from "zod";

import { Linear } from "~/integrations/linear.server";
import { Sentry } from "~/integrations/sentry";
import { LinearTeamID } from "~/lib/constants";
import { requireUser } from "~/lib/session.server";
import { toast } from "~/lib/toast.server";

export const validator = withZod(
  z.object({
    title: z.string(),
    description: z.string(),
    labelId: z.string(),
    attachmentUrl: z.string().url().or(z.literal("")),
  }),
);

export async function action({ request }: ActionFunctionArgs) {
  const user = await requireUser(request);
  if (request.method !== "POST") {
    return new Response(null, { status: 405 });
  }

  const result = await validator.validate(await request.formData());
  if (result.error) {
    return validationError(result.error);
  }

  const { labelId, title, description } = result.data;

  const issueRequest = await Linear.createIssue({
    title,
    teamId: LinearTeamID.Alliance,
    labelIds: [labelId],
    description: `${description}\n\n---\n\n- created by ${user.contact.email}\n\n${
      result.data.attachmentUrl ? `![Attachment](${result.data.attachmentUrl})` : ""
    }`,
  });

  if (!issueRequest.success) {
    console.error("Error creating issue", issueRequest);
    Sentry.captureException(issueRequest);
  }

  return toast.json(
    request,
    { success: true },
    {
      title: "Issue Created",
      description: "An issue has been created on our board.",
    },
  );
}
