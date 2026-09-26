/** Server-side backend configuration shared by auth and authenticated requests. */
export function backendBaseUrl(env = process.env) {
  if (!env.BACKEND_URL?.trim()) {
    throw new Error("BACKEND_URL is required. Set it to the running API origin in the frontend hosting environment.");
  }
  let url;
  try { url = new URL(env.BACKEND_URL.trim()); }
  catch { throw new Error("BACKEND_URL must be an absolute HTTP(S) origin."); }
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password ||
      url.search || url.hash || !/^\/*$/.test(url.pathname)) {
    throw new Error("BACKEND_URL must be an HTTP(S) origin without credentials, a path, query, or fragment.");
  }
  const deployed = env.VERCEL === '1' || env.RENDER === 'true';
  if (deployed && /^(localhost\.?|127\..*|0\.0\.0\.0|\[::1\])$/i.test(url.hostname)) {
    throw new Error("BACKEND_URL points to localhost in a hosted deployment. Set it to your deployed API origin.");
  }
  if (deployed && url.protocol !== 'https:') {
    throw new Error("BACKEND_URL must use HTTPS in a hosted deployment.");
  }
  return url.origin;
}

/** Allow a sleeping API to start; never replay a POST after an uncertain response. */
export function backendRequest(path, options = {}) {
  if (!path.startsWith('/api/')) throw new Error('Expected a backend /api/ path.');
  const timeout = AbortSignal.timeout(120_000);
  return fetch(`${backendBaseUrl()}${path}`, {
    ...options,
    signal: options.signal ? AbortSignal.any([options.signal, timeout]) : timeout,
    cache: 'no-store',
  });
}
