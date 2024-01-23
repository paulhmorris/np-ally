import type { LoaderFunctionArgs } from "@remix-run/node";

import { prisma } from "~/integrations/prisma.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const host = request.headers.get("X-Forwarded-Host") ?? request.headers.get("host");

  try {
    const url = new URL("/", `http://${host}`);
    // if we can connect to the database and make a simple query
    // and make a HEAD request to ourselves, then we're good.
    await Promise.all([
      prisma.user.count(),
      fetch(url.toString(), { method: "HEAD" }).then((r) => {
        if (!r.ok) return Promise.reject(r);
      }),
    ]);
    return new Response("OK");
  } catch (error: unknown) {
    // eslint-disable-next-line no-console
    console.log("healthcheck ❌", { error });
    return new Response("ERROR", { status: 500 });
  }
};
