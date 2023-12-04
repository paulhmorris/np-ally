import type { ActionFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";

import { Sentry } from "~/integrations/sentry";
import { logout } from "~/lib/session.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  Sentry.setUser(null);
  return await logout(request);
};

export const loader = () => redirect("/");
