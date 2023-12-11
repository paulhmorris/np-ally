import { UserRole } from "@prisma/client";
import { type LoaderFunctionArgs, type MetaFunction } from "@remix-run/node";
import { redirect } from "remix-typedjson";

import { ErrorComponent } from "~/components/error-component";
import { requireUser } from "~/lib/session.server";

export const meta: MetaFunction = () => [{ title: "Home • Alliance 436" }];

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireUser(request);
  if (user.role === UserRole.USER) {
    return redirect("/dashboards/staff");
  }
  return redirect("/dashboards/admin");
}

export function ErrorBoundary() {
  return <ErrorComponent />;
}
