import type { NextConfig } from "next";

import { backendBaseUrl } from "./src/lib/backend-http.mjs";

// Fail the deployment before shipping an unusable login page.
if (process.env.VERCEL === "1" || process.env.RENDER === "true") {
  backendBaseUrl();
  if (!process.env.AUTH_SECRET || process.env.AUTH_SECRET === "replace-with-a-generated-secret") {
    throw new Error("Set a generated AUTH_SECRET in the frontend hosting environment.");
  }
}

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;
