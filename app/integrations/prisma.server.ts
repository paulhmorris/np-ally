import { Pool, neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@prisma/client";
import invariant from "tiny-invariant";
import ws from "ws";

// Borrowed & modified from https://github.com/jenseng/abuse-the-platform/blob/main/app/utils/singleton.ts
// Thanks @jenseng!

export const singleton = <Value>(name: string, valueFactory: () => Value): Value => {
  const g = global as unknown as { __singletons: Record<string, unknown> };
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  g.__singletons ??= {};
  g.__singletons[name] ??= valueFactory();
  return g.__singletons[name] as Value;
};

function getPrismaClient() {
  const { DATABASE_URL } = process.env;
  invariant(typeof DATABASE_URL === "string", "DATABASE_URL env var not set");

  if (process.env.NODE_ENV === "development") {
    const databaseUrl = new URL(DATABASE_URL);
    const client = new PrismaClient({
      datasources: {
        db: {
          url: databaseUrl.toString(),
        },
      },
    });
    // connect eagerly
    void client.$connect();

    return client;
  }

  neonConfig.webSocketConstructor = ws;
  const pool = new Pool({ connectionString: DATABASE_URL, ...neonConfig });
  const adapter = new PrismaNeon(pool);
  const client = new PrismaClient({ adapter });
  void client.$connect();
  return client;
}

// Hard-code a unique key, so we can look up the client when this module gets re-imported
const db = singleton("prisma", getPrismaClient);

export { db };
