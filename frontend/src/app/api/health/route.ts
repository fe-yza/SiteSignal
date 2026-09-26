import { backendBaseUrl, backendRequest } from "@/lib/backend-http.mjs";

export const dynamic = "force-dynamic";
export const maxDuration = 180;

// Tests the actual Vercel -> API -> database path without exposing secrets.
export async function GET() {
  const started = Date.now();
  try {
    const origin = backendBaseUrl();
    const response = await backendRequest("/api/health");
    const data = await response.json();
    const healthy = response.ok && data.status === "ok" && data.database === "connected";
    console.info("backend_health", { origin, status: response.status, healthy, durationMs: Date.now() - started });
    return Response.json({ status: healthy ? "ok" : "unavailable" }, {
      status: healthy ? 200 : 503,
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("backend_health_failed", {
      error: error instanceof Error ? error.name : "UnknownError",
      durationMs: Date.now() - started,
    });
    return Response.json({ status: "unavailable" }, {
      status: 503, headers: { "Cache-Control": "no-store" },
    });
  }
}
