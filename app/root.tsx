import "@fontsource-variable/dm-sans/wght.css";
import { cssBundleHref } from "@remix-run/css-bundle";
import type { LinksFunction, LoaderFunctionArgs } from "@remix-run/node";
import {
  Link,
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  isRouteErrorResponse,
  useRouteError,
} from "@remix-run/react";
import { captureRemixErrorBoundaryError } from "@sentry/remix";
import { PreventFlashOnWrongTheme, ThemeProvider, useTheme } from "remix-themes";
import { typedjson, useTypedLoaderData } from "remix-typedjson";

import { Notifications } from "~/components/notifications";
import { Button } from "~/components/ui/button";
import { commitSession, getSession, getUser, themeSessionResolver } from "~/lib/session.server";
import { getGlobalToast } from "~/lib/toast.server";
import { cn } from "~/lib/utils";
import stylesheet from "~/tailwind.css";

// prettier-ignore
export const links: LinksFunction = () => [
  { rel: "stylesheet", href: stylesheet },
  ...(cssBundleHref ? [{ rel: "stylesheet", href: cssBundleHref }] : [])
];

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const session = await getSession(request);
  const { getTheme } = await themeSessionResolver(request);

  return typedjson(
    {
      user: await getUser(request),
      theme: getTheme(),
      serverToast: getGlobalToast(session),
    },
    {
      headers: {
        "Set-Cookie": await commitSession(session),
      },
    },
  );
};

export default function AppWithProviders() {
  const { theme } = useTypedLoaderData<typeof loader>();
  return (
    <ThemeProvider specifiedTheme={theme} themeAction="/resources/set-theme">
      <App />
    </ThemeProvider>
  );
}

function App() {
  const data = useTypedLoaderData<typeof loader>();
  const [theme] = useTheme();

  return (
    <html lang="en" className={cn("h-full", theme)}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <Meta />
        <PreventFlashOnWrongTheme ssrTheme={Boolean(data.theme)} />
        <Links />
      </head>
      <body className="h-full font-sans">
        <Outlet />
        <Notifications serverToast={data.serverToast} />
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
}

export function ErrorBoundary() {
  const error = useRouteError();
  const isRouteError = isRouteErrorResponse(error);
  captureRemixErrorBoundaryError(error);
  console.error(error);

  const title = isRouteError ? error.statusText : "Unknown Error";
  let description = "An unknown error occurred.";

  if (isRouteError) {
    switch (error.status) {
      case 404:
        description = "Sorry, we couldn’t find the page you’re looking for.";
        break;
      case 401:
        description = "You are not authorized to view this page.";
        break;
      case 403:
        description = "You are not authorized to view this page.";
        break;
      case 500:
        description = "An error occurred on the server.";
        break;
      default:
        description = "An unknown error occurred.";
        break;
    }
  }

  return (
    <html lang="en">
      <head>
        <title>Oh no!</title>
        <Meta />
        <Links />
      </head>
      <body>
        <main className="grid min-h-full place-items-center px-6 py-24 sm:py-32 lg:px-8">
          <div className="text-center">
            {isRouteError ? <p className="text-base font-semibold text-primary">{error.status}</p> : null}
            <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-5xl">{title}</h1>
            <p className="mt-6 text-base leading-7 text-muted-foreground">{description}</p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Button asChild>
                <Link to="/">Go back home</Link>
              </Button>
              <Button asChild variant="ghost">
                <Link to="/">
                  Contact support <span aria-hidden="true">&rarr;</span>
                </Link>
              </Button>
            </div>
          </div>
        </main>
        <Scripts />
      </body>
    </html>
  );
}
