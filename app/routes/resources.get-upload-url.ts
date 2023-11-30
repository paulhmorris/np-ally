import { ActionFunctionArgs } from "@remix-run/node";
import { typedjson } from "remix-typedjson";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";

import { Bucket } from "~/integrations/bucket.server";
import { requireUserId } from "~/lib/session.server";

const validator = z.object({
  fileName: z.string(),
  contentType: z.string(),
});

export async function action({ request }: ActionFunctionArgs) {
  const userId = await requireUserId(request);

  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const result = validator.safeParse(await request.json());
  if (!result.success) {
    return new Response(fromZodError(result.error).toString(), { status: 400 });
  }

  const { fileName, contentType } = result.data;
  const { url, key } = await Bucket.getPresignedUrl({ fileName, contentType, userId });

  return typedjson({ signedUrl: url, s3Key: key });
}
