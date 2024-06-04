/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import { RemixServer } from "@remix-run/react";
import { nodeProfilingIntegration } from "@sentry/profiling-node";
import type { EntryContext } from "@vercel/remix";
import { handleRequest } from "@vercel/remix";

import { Sentry } from "~/integrations/sentry";

const ABORT_DELAY = 5_000;

Sentry.init({
  dsn: "https://f18051d71458f411f51af7ca0308b1cb@o4505496663359488.ingest.us.sentry.io/4506395673886720",
  sampleRate: 1,
  tracesSampleRate: 0.5,
  profilesSampleRate: 0.5,
  environment: process.env.VERCEL_ENV,
  enabled: process.env.NODE_ENV === "production",
  integrations: [nodeProfilingIntegration(), Sentry.prismaIntegration()],
});

export const handleError = Sentry.sentryHandleError;

export default function (
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  remixContext: EntryContext,
) {
  const remixServer = <RemixServer context={remixContext} url={request.url} abortDelay={ABORT_DELAY} />;
  return handleRequest(request, responseStatusCode, responseHeaders, remixServer);
}
