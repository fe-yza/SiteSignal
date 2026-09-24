import { FieldSketch } from "@/components/field-sketch";
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
          <span className="editorial-title text-3xl text-foreground">{APP_NAME}</span>
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
        <section className="mx-auto max-w-5xl px-5 py-16 sm:px-8 sm:py-24">
          <div className="sketch-heading grid items-center gap-8 md:grid-cols-[1.1fr_1fr]">
          <div>
          <p className="eyebrow mb-6">A little clarity for your corner of the web</p>
          <h1 className="editorial-title text-5xl sm:text-7xl">
            Know what to fix next.
          </h1>
          <p className="mt-6 max-w-lg text-base text-muted">
            SiteSignal crawls your website, finds the technical and on-page SEO problems holding
            back your rankings, and turns them into a prioritized list of what to fix first.
          </p>
          <div className="mt-8 flex">
            <LinkButton href="/register" size="lg">
              Audit your website
            </LinkButton>
          </div>
          </div>
          <FieldSketch className="mx-auto w-full max-w-72 md:max-w-sm" />
          </div>
        </section>

        <section className="border-t border-border bg-surface-subtle py-16 sm:py-20">
          <div className="mx-auto max-w-5xl px-4 sm:px-6">
            <h2 className="text-center text-sm font-semibold uppercase tracking-wide text-muted">
              How it works
            </h2>
            <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {STEPS.map((step, i) => (
                <div key={step.title} className="border-t border-border-strong py-6">
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
          <h2 className="editorial-title text-4xl text-foreground">
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
