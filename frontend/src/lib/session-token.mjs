import { getToken } from 'next-auth/jwt';

// Auth.js uses a different cookie name and encryption salt on HTTPS.
// Recognize chunked cookies too, and prefer the secure cookie when present.
export function readSessionToken(req, secret) {
  const cookie = req.headers.get('cookie') ?? '';
  const secureCookie = /(?:^|;\s*)__Secure-authjs\.session-token(?:\.\d+)?=/.test(cookie);
  return getToken({ req, secret, secureCookie });
}
