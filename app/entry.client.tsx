/* eslint-disable import/namespace */
import { RemixBrowser, useLocation, useMatches } from "@remix-run/react";
import { StrictMode, startTransition, useEffect } from "react";
import { hydrateRoot } from "react-dom/client";

import { Sentry } from "~/integrations/sentry";

Sentry.init({
  dsn: undefined,
  tracesSampleRate: 0.25,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1,

  integrations: [
    new Sentry.BrowserTracing({
      routingInstrumentation: Sentry.remixRouterInstrumentation(useEffect, useLocation, useMatches),
    }),
    new Sentry.Replay(),
  ],
});

startTransition(() => {
  hydrateRoot(
    document,
    <StrictMode>
      <RemixBrowser />
    </StrictMode>,
  );
});
