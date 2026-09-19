import Link from "next/link";
import type { ReactNode } from "react";

import { APP_NAME } from "@/lib/config";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface-subtle px-4 py-12">
      <Link
        href="/"
        className="mb-8 text-sm font-semibold tracking-tight text-foreground"
      >
        {APP_NAME}
      </Link>
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}
