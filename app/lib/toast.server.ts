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

class ToastHandler {
  private defaultToasts: Record<NonNullable<Toast["variant"]>, Partial<Toast>> = {
    default: {
      variant: "default",
      title: "Success",
      description: "Your action was successful.",
    },
    warning: {
      variant: "warning",
      title: "Warning",
      description: "Your action was successful, but there may be some issues.",
    },
    destructive: {
      variant: "destructive",
      title: "Something went wrong",
      description: "Your action was not successful.",
    },
  };
  async redirect(request: Request, url: string, toast: Toast, init: ResponseInit = {}) {
    const session = await getSession(request);
    const variant = toast.variant || "default";

    const headers = new Headers(init.headers);
    headers.append("Set-Cookie", await commitSession(session));

    setGlobalToast(session, { ...this.defaultToasts[variant], ...toast });
    return redirect(url, { ...init, headers });
  }

  async json<Data>(request: Request, data: Data, toast: Toast, init: ResponseInit = {}): Promise<TypedResponse<Data>> {
    const session = await getSession(request);
    const variant = toast.variant || "default";

    const headers = new Headers(init.headers);
    headers.append("Set-Cookie", await commitSession(session));

    setGlobalToast(session, { ...this.defaultToasts[variant], ...toast });
    return typedjson(data, { ...init, headers });
  }
}

export const toast = new ToastHandler();
