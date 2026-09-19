import "server-only";

import { cookies } from "next/headers";
import { getToken } from "next-auth/jwt";

/**
 * Reads the FastAPI access token back out of the NextAuth JWT.
 *
 * Deliberately uses next-auth/jwt's getToken() (which decodes the raw signed
 * cookie) instead of auth(), because auth()'s session() callback never
 * copies access_token onto the object it returns — that object is exposed to
 * client-side JS via useSession()/`/api/auth/session`, so the backend token
 * must never live there.
 *
 * Pass the incoming `Request` when called from a Route Handler. Server
 * Components don't have one, so we reconstruct a minimal request from
 * next/headers's cookies() instead.
 */
export async function getBackendAccessToken(req?: Request): Promise<string | null> {
  if (req) {
    const token = await getToken({ req, secret: process.env.AUTH_SECRET });
    return token?.accessToken ?? null;
  }

  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");

  const token = await getToken({
    req: { headers: { cookie: cookieHeader } } as unknown as Request,
    secret: process.env.AUTH_SECRET,
  });

  return token?.accessToken ?? null;
}
