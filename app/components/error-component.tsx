import { Link, isRouteErrorResponse, useRouteError } from "@remix-run/react";
import { captureRemixErrorBoundaryError } from "@sentry/remix";

import { Button } from "~/components/ui/button";

export function ErrorComponent() {
  const error = useRouteError();
  const isRouteError = isRouteErrorResponse(error);
  captureRemixErrorBoundaryError(error);

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
    <div className="mt-10 text-center">
      {isRouteError ? <p className="text-base font-semibold text-destructive">{error.status}</p> : null}
      <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-5xl">{title}</h1>
      <p className="mt-3 text-base leading-7 text-muted-foreground">{description}</p>
      <div className="mt-5 flex items-center justify-center gap-x-6">
        <Button asChild>
          <Link to="/">Go back home</Link>
        </Button>
        <Button asChild variant="ghost">
          <Link to="/">
            Contact support <span aria-hidden="true">&rarr;</span>
          </Link>
        </Button>
      </div>
      <p className="mt-24 text-left text-sm font-bold">Stack Trace</p>
      <pre className="whitespace-pre-wrap rounded bg-destructive/10 p-4 text-left text-xs text-destructive">
        <code>{error instanceof Error ? error.stack : JSON.stringify(error)}</code>
      </pre>
    </div>
  );
}
