import { Globe, ListChecks, Search, Target } from "lucide-react";
import Link from "next/link";

import { LinkButton } from "@/components/ui/link-button";
import { APP_NAME } from "@/lib/config";

const STEPS = [
  {
    icon: Globe,
    title: "Connect your website",
    description: "Enter your homepage URL — no code, no plugin to install.",
  },
  {
    icon: Search,
    title: "We crawl and analyze it",
    description:
      "We crawl up to 100 pages and run a deterministic set of technical and on-page SEO checks.",
  },
  {
    icon: Target,
    title: "Get prioritized opportunities",
    description:
      "Issues are grouped and ranked by real impact, so you know exactly what to fix first.",
  },
  {
    icon: ListChecks,
    title: "Track improvements over time",
    description: "Every audit is saved, so you can see what changed after each fix.",
  },
];

export default function LandingPage() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
          <span className="text-sm font-semibold tracking-tight text-foreground">{APP_NAME}</span>
          <nav className="flex items-center gap-2">
            <Link
              href="/login"
              className="rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              Log in
            </Link>
            <LinkButton href="/register" size="sm">
              Get started
            </LinkButton>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <section className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6 sm:py-28">
          <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
            Know what to fix next.
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base text-muted sm:text-lg">
            SiteSignal crawls your website, finds the technical and on-page SEO problems holding
            back your rankings, and turns them into a prioritized list of what to fix first.
          </p>
          <div className="mt-8 flex justify-center">
            <LinkButton href="/register" size="lg">
              Audit your website
            </LinkButton>
          </div>
        </section>

        <section className="border-t border-border bg-surface-subtle py-16 sm:py-20">
          <div className="mx-auto max-w-5xl px-4 sm:px-6">
            <h2 className="text-center text-sm font-semibold uppercase tracking-wide text-muted">
              How it works
            </h2>
            <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {STEPS.map((step, i) => (
                <div key={step.title} className="rounded-lg border border-border bg-surface p-5">
                  <div className="flex size-9 items-center justify-center rounded-md bg-accent-subtle text-accent">
                    <step.icon className="size-4.5" />
                  </div>
                  <p className="mt-3 text-xs font-medium text-muted">Step {i + 1}</p>
                  <h3 className="mt-1 text-sm font-semibold text-foreground">{step.title}</h3>
                  <p className="mt-1.5 text-sm text-muted-foreground">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6 sm:py-20">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">
            Real crawl data. Deterministic analysis. No guesswork.
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-muted">
            SiteSignal isn&apos;t a generic SEO score generator — every recommendation traces back
            to something we actually found on your site, with the reasoning shown alongside it.
          </p>
          <div className="mt-8 flex justify-center">
            <LinkButton href="/register" size="lg">
              Get started for free
            </LinkButton>
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-6">
        <p className="text-center text-xs text-muted">{APP_NAME}</p>
      </footer>
    </div>
  );
}
