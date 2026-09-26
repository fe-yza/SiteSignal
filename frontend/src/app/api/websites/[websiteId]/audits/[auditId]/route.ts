import { NextResponse } from "next/server";

import { backendRequest } from "@/lib/backend-http.mjs";

import { getBackendAccessToken } from "@/lib/backend-session";

// Thin server-side proxy so the client-side progress poller never holds a
// backend token itself — it polls this Route Handler, which attaches the
// token read from the NextAuth JWT.
export async function GET(
  request: Request,
  { params }: { params: Promise<{ websiteId: string; auditId: string }> }
) {
  const { websiteId, auditId } = await params;
  const token = await getBackendAccessToken(request);

  const res = await backendRequest(
    `/api/websites/${websiteId}/audits/${auditId}`,
    {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      cache: "no-store",
    }
  );

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
