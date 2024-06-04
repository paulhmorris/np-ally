import { vitePlugin as remix } from "@remix-run/dev";
import { installGlobals } from "@remix-run/node";
import { sentryVitePlugin } from "@sentry/vite-plugin";
import { vercelPreset } from "@vercel/remix/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

const isVercel = process.env.VERCEL === "1";
const isCI = process.env.CI;

installGlobals();

export default defineConfig({
  resolve: {
    alias: {
      ".prisma/client/index-browser": "./node_modules/.prisma/client/index-browser.js",
    },
  },
  server: {
    port: 3000,
  },
  plugins: [
    tsconfigPaths(),
    remix({
      ...(isVercel && { presets: [vercelPreset()] }),
      ignoredRouteFiles: ["**/.*", "**/*.test.{ts,tsx}"],
    }),
    isCI &&
      sentryVitePlugin({
        telemetry: false,
        org: process.env.SENTRY_ORG,
        project: process.env.SENTRY_PROJECT,
        authToken: process.env.SENTRY_AUTH_TOKEN,
      }),
  ],

  build: {
    sourcemap: !!process.env.CI,
  },
});
