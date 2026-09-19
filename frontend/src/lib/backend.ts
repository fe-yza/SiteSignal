import "server-only";

import { getBackendAccessToken } from "@/lib/backend-session";

export class BackendError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

/**
 * Calls the FastAPI backend on behalf of the signed-in user. Server-only:
 * every call to the backend from the frontend goes through this, never
 * directly from client-side JS with a token in hand.
 */
export async function backendFetch<T>(
  path: string,
  options: RequestInit = {},
  req?: Request
): Promise<T> {
  const token = await getBackendAccessToken(req);

  const res = await fetch(`${process.env.BACKEND_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    cache: "no-store",
  });

  if (!res.ok) {
    let detail = "Something went wrong. Please try again.";
    try {
      const data = await res.json();
      if (typeof data.detail === "string") detail = data.detail;
    } catch {
      // response wasn't JSON; fall back to the generic message
    }
    throw new BackendError(res.status, detail);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}
