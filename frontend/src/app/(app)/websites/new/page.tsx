import type { Metadata } from "next";

import { AddWebsiteForm } from "./add-website-form";

export const metadata: Metadata = { title: "Add website" };

export default function NewWebsitePage() {
  return (
    <div className="mx-auto max-w-lg px-4 py-10 sm:px-6">
      <h1 className="text-xl font-semibold tracking-tight text-foreground">Add a website</h1>
      <p className="mt-1 text-sm text-muted">
        Enter the homepage URL. We&apos;ll crawl up to 100 pages on the same domain — that
        usually takes under a minute — and surface what&apos;s holding back your search rankings.
      </p>

      <div className="mt-6 rounded-lg border border-border bg-surface p-6">
        <AddWebsiteForm />
      </div>
    </div>
  );
}
