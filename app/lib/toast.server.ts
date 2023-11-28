import type { Session, TypedResponse } from "@remix-run/node";
import { redirect, typedjson } from "remix-typedjson";

import type { Toast } from "~/components/ui/use-toast";
import { commitSession, getSession } from "~/lib/session.server";

export function setGlobalToast(session: Session, toast: Toast) {
  session.flash("globalMessage", toast);
}

export function getGlobalToast(session: Session): Toast | null {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  return (session.get("globalMessage") as Toast) || null;
}

export const toast = {
  redirect: redirectWithToast,
  json: jsonWithToast,
};

async function redirectWithToast(
  request: Request,
  url: string,
  toast: Toast = {
    title: "Success",
    variant: "default",
    description: "Your action was successful.",
  },
  init: ResponseInit = {},
) {
  const session = await getSession(request);
  setGlobalToast(session, toast);
  return redirect(url, {
    ...init,
    headers: { "Set-Cookie": await commitSession(session) },
  });
}

async function jsonWithToast<Data>(
  request: Request,
  data: Data,
  toast: Toast = {
    title: "Success",
    variant: "default",
    description: "Your action was successful.",
  },
  init: ResponseInit = {},
): Promise<TypedResponse<Data>> {
  const session = await getSession(request);
  setGlobalToast(session, toast);
  return typedjson(data, {
    ...init,
    headers: { "Set-Cookie": await commitSession(session) },
  });
}
