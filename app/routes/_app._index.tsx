import { json, type LoaderFunctionArgs, type MetaFunction } from "@remix-run/node";

import { ErrorComponent } from "~/components/error-component";
import { PageHeader } from "~/components/page-header";
import { requireUserId } from "~/lib/session.server";

export const meta: MetaFunction = () => [{ title: "Dashboard • Alliance 436" }];

export async function loader({ request }: LoaderFunctionArgs) {
  await requireUserId(request);
  return json({});
}

export default function Index() {
  return (
    <>
      <PageHeader title="Dashboard" />
    </>
  );
}

export function ErrorBoundary() {
  return <ErrorComponent />;
}
