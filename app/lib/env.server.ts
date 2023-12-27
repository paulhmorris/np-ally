/* eslint-disable @typescript-eslint/no-empty-interface */
/* eslint-disable @typescript-eslint/no-namespace */
import { TypeOf, z } from "zod";

const serverEnvValidation = z.object({
  // Remix
  NODE_ENV: z.enum(["development", "production", "test"]),
  SESSION_SECRET: z.string().min(16),
  URL: z.string().url(),

  // Cloudflare
  AWS_BUCKET_NAME: z.string().min(1),
  AWS_BUCKET_URL: z.string().url(),
  AWS_ACCESS_KEY_ID: z.string().min(1),
  AWS_SECRET_ACCESS_KEY: z.string().min(1),

  // Database
  DATABASE_URL: z.string().min(1),

  // Sentry
  SENTRY_DSN: z.string().url(),

  // Linear
  LINEAR_API_KEY: z.string().min(1).startsWith("lin_api_"),

  // Trigger.dev
  TRIGGER_API_KEY: z.string().startsWith("tr_"),
  TRIGGER_API_URL: z.string().url(),
});

const clientEnvValidation = z.object({
  // Trigger.dev
  TRIGGER_PUBLIC_API_KEY: z.string().startsWith("pk_"),
});

declare global {
  // Server side
  namespace NodeJS {
    interface ProcessEnv extends TypeOf<typeof serverEnvValidation & typeof clientEnvValidation> {}
  }

  // Client side
  interface Window {
    ENV: TypeOf<typeof clientEnvValidation>;
  }
}

export function validateEnv(): void {
  try {
    console.info("🌎 validating environment variables..");
    serverEnvValidation.parse(process.env);
    clientEnvValidation.parse(process.env);
  } catch (err) {
    if (err instanceof z.ZodError) {
      const { fieldErrors } = err.flatten();
      const errorMessage = Object.entries(fieldErrors)
        .map(([field, errors]) => (errors ? `${field}: ${errors.join(", ")}` : field))
        .join("\n  ");
      throw new Error(`Missing environment variables:\n  ${errorMessage}`);
    }
  }
}
