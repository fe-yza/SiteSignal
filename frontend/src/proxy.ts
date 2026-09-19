import { NextResponse } from "next/server";

import { auth } from "@/auth";

const protectedPrefixes = ["/dashboard", "/websites", "/onboarding"];
const authOnlyPages = ["/login", "/register"];

// Optimistic check only (reads the session cookie, no DB hit) — real
// authorization still happens close to the data in Server Components and
// backendFetch, per Next.js's auth guide.
export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;
  const isProtected = protectedPrefixes.some((p) => pathname.startsWith(p));
  const isAuthOnlyPage = authOnlyPages.includes(pathname);

  if (isProtected && !isLoggedIn) {
    const url = new URL("/login", req.nextUrl.origin);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  if (isAuthOnlyPage && isLoggedIn) {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|.*\\.(?:png|svg|ico)$).*)"],
};
