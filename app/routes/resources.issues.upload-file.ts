import { ActionFunctionArgs } from "@remix-run/node";
import { typedjson } from "remix-typedjson";

import { Linear } from "~/integrations/linear.server";
import { Sentry } from "~/integrations/sentry";
import { SessionService } from "~/services.server/session";

export async function action({ request }: ActionFunctionArgs) {
  await SessionService.requireUserId(request);
  await SessionService.requireOrgId(request);

  const formData = await request.formData();
  const file = formData.get("file") as File;
  const uploadPayload = await Linear.fileUpload(file.type, file.name, file.size);
  if (!uploadPayload.success) {
    console.error("Error uploading file", uploadPayload);
    Sentry.captureException(uploadPayload);
    return;
  }

  if (!uploadPayload.uploadFile) {
    return;
  }

  const { uploadUrl, assetUrl } = uploadPayload.uploadFile;

  const headers = new Headers();
  headers.set("Content-Type", file.type);
  headers.set("Cache-Control", "public, max-age=31536000");
  uploadPayload.uploadFile.headers.forEach(({ key, value }) => headers.set(key, value));

  try {
    await fetch(uploadUrl, {
      method: "PUT",
      headers,
      body: file,
    });

    return typedjson({ url: assetUrl });
  } catch (e) {
    console.error("Error uploading file", uploadPayload);
    Sentry.captureException(e);
  }
}
