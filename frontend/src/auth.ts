import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

import type { BackendTokenResponse } from "@/lib/backend-types";

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const email = credentials?.email;
        const password = credentials?.password;
        if (typeof email !== "string" || typeof password !== "string") return null;

        const res = await fetch(`${process.env.BACKEND_URL}/api/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });

        if (!res.ok) return null;

        const data: BackendTokenResponse = await res.json();
        return {
          id: data.user.id,
          email: data.user.email,
          accessToken: data.access_token,
          hasSeenIntro: data.user.has_seen_intro,
          dismissedHints: data.user.dismissed_hints,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.accessToken = user.accessToken;
        token.hasSeenIntro = user.hasSeenIntro;
        token.dismissedHints = user.dismissedHints;
      }
      return token;
    },
    // access_token intentionally stays out of the session object: useSession()
    // and /api/auth/session are readable by client-side JS, so anything
    // placed here is visible to the browser. Server code reads the raw JWT
    // via getBackendAccessToken() (next-auth/jwt getToken) instead.
    async session({ session, token }) {
      session.user.id = token.id;
      session.user.hasSeenIntro = token.hasSeenIntro;
      session.user.dismissedHints = token.dismissedHints;
      return session;
    },
  },
});
