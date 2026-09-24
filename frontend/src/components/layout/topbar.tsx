import Link from "next/link";

import { logoutAction } from "@/app/(app)/actions";
import { APP_NAME } from "@/lib/config";

export function Topbar({ userEmail }: { userEmail: string }) {
  return (
    <header className="flex h-20 shrink-0 items-center justify-between border-b border-border bg-background px-5 sm:px-10">
      <Link
        href="/dashboard"
        className="editorial-title text-3xl text-foreground px-1 -mx-1"
      >
        {APP_NAME}
      </Link>

      <div className="flex items-center gap-3">
        <span className="hidden text-sm text-muted sm:inline">{userEmail}</span>
        <form action={logoutAction}>
          <button
            type="submit"
            className="rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-surface-subtle hover:text-foreground"
          >
            Log out
          </button>
        </form>
      </div>
    </header>
  );
}
