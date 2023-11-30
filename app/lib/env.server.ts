/* eslint-disable @typescript-eslint/no-empty-interface */
/* eslint-disable @typescript-eslint/no-namespace */
import { TypeOf, z } from "zod";

const envValidation = z.object({
  // Remix
  NODE_ENV: z.string().min(1),
  SESSION_SECRET: z.string().min(1),

  // Cloudflare
  AWS_BUCKET_NAME: z.string().min(1),
  AWS_BUCKET_URL: z.string().min(1),
  AWS_ACCESS_KEY_ID: z.string().min(1),
  AWS_SECRET_ACCESS_KEY: z.string().min(1),

  // Database
  DATABASE_URL: z.string().min(1),
});

declare global {
  namespace NodeJS {
    interface ProcessEnv extends TypeOf<typeof envValidation> {}
  }
}

export function validateEnv(): void {
  try {
    console.log("Validating environment variables...");
    envValidation.parse(process.env);
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
