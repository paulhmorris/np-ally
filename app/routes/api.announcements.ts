import { ActionFunctionArgs } from "@remix-run/node";
import { withZod } from "@remix-validated-form/with-zod";
import dayjs from "dayjs";
import { typedjson } from "remix-typedjson";
import { validationError } from "remix-validated-form";
import { z } from "zod";

import { prisma } from "~/integrations/prisma.server";
import { toast } from "~/lib/toast.server";
import { SessionService } from "~/services/SessionService.server";

export const validator = withZod(
  z.object({
    title: z.string(),
    content: z.string(),
    expiresAt: z.coerce.date().optional(),
  }),
);

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== "POST") {
    throw typedjson({ success: false, message: "Method Not Allowed" }, { status: 405 });
  }

  await SessionService.requireAdmin(request);

  const result = await validator.validate(await request.formData());
  if (result.error) {
    return validationError(result.error);
  }

  const { title, content, expiresAt } = result.data;

  if (expiresAt && dayjs(expiresAt).isBefore(new Date())) {
    return validationError({
      fieldErrors: {
        expiresAt: "The expiration date must be in the future.",
      },
    });
  }

  const announcement = await prisma.announcement.create({
    data: {
      title,
      content,
      expiresAt: dayjs(expiresAt).endOf("day").toDate(),
    },
  });

  return toast.json(
    request,
    { success: true },
    {
      type: "success",
      title: "Announcement Created",
      description: `The announcement is now visible to all users and admins, and will expire at ${dayjs(announcement.expiresAt).format("M/D/YY h:mm a")}.`,
    },
  );
}
