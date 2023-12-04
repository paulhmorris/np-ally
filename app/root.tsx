import "@fontsource-variable/dm-sans/wght.css";
import { cssBundleHref } from "@remix-run/css-bundle";
import type { LinksFunction, LoaderFunctionArgs } from "@remix-run/node";
import { Links, LiveReload, Meta, Outlet, Scripts, ScrollRestoration, useRouteError } from "@remix-run/react";
import { captureRemixErrorBoundaryError } from "@sentry/remix";
import { typedjson, useTypedLoaderData } from "remix-typedjson";

import { Notifications } from "~/components/notifications";
import { ThemeProvider } from "~/components/theme-provider";
import { commitSession, getSession, getUser } from "~/lib/session.server";
import { getGlobalToast } from "~/lib/toast.server";
import stylesheet from "~/tailwind.css";

// prettier-ignore
export const links: LinksFunction = () => [
  { rel: "stylesheet", href: stylesheet },
  ...(cssBundleHref ? [{ rel: "stylesheet", href: cssBundleHref }] : [])
];

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const session = await getSession(request);

  return typedjson(
    {
      user: await getUser(request),
      serverToast: getGlobalToast(session),
    },
    {
      headers: {
        "Set-Cookie": await commitSession(session),
      },
    },
  );
};

export const ErrorBoundary = () => {
  const error = useRouteError();
  captureRemixErrorBoundaryError(error);
  return <div>Something went wrong</div>;
};

export default function App() {
  const { serverToast } = useTypedLoaderData<typeof loader>();
  return (
    <ThemeProvider>
      <html lang="en" className="h-full">
        <head>
          <meta charSet="utf-8" />
          <meta name="viewport" content="width=device-width,initial-scale=1" />
          <Meta />
          <Links />
        </head>
        <body className="h-full font-sans">
          <Outlet />
          <Notifications serverToast={serverToast} />
          <ScrollRestoration />
          <Scripts />
          <LiveReload />
        </body>
      </html>
    </ThemeProvider>
  );
}
