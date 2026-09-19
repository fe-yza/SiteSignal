import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    id: string;
    email: string;
    accessToken: string;
    hasSeenIntro: boolean;
    dismissedHints: string[];
  }

  interface Session {
    user: {
      id: string;
      hasSeenIntro: boolean;
      dismissedHints: string[];
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    accessToken: string;
    hasSeenIntro: boolean;
    dismissedHints: string[];
  }
}
