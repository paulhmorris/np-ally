/* eslint-disable import/namespace */
import { RemixBrowser, useLocation, useMatches } from "@remix-run/react";
import * as Sentry from "@sentry/remix";
import { StrictMode, startTransition, useEffect } from "react";
import { hydrateRoot } from "react-dom/client";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 0.25,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1,
  enabled: process.env.NODE_ENV === "production",

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
