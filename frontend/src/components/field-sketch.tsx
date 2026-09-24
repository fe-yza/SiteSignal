import { cn } from "@/lib/utils";

/** An original margin illustration: a small trail of discoveries on the web. */
export function FieldSketch({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 340 230" fill="none" aria-hidden="true" className={cn("pointer-events-none text-foreground", className)}>
      <g stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M35 53c13-17 40-25 44-12 4 12-16 15-12 1 6-17 34-20 48-13" />
        <path d="m121 58 7-16 4 16 15 6-16 4-6 17-4-16-14-5Z" fill="var(--sketch-sage)" />
        <path d="M173 43c-4-9 4-17 11-12 1-12 15-15 20-5 9-7 21 4 13 13 12 8 5 19-7 16-2 13-17 13-21 4-10 5-18-5-16-16Z" fill="var(--sketch-sage)" />
        <path d="m253 26 6-9m2 20 13-3 M301 74c-2-7 8-10 10-3 2 7-7 11-10 3Z" />
        <path d="M96 104q67-5 136 1l-4 92q-66 4-136-2Z" fill="var(--background)" />
        <path d="M94 122q66-3 136 0m-123-10 1 1m10-1 1 1m10-2 1 1 M110 143l50-1m-51 13 35 1m-35 13 25 1" />
        <path d="M203 149c-25-15-48 18-25 36 28 17 49-21 25-36Z" fill="var(--accent-subtle)" />
        <path d="m206 182 27 28 7-8-29-25m-20-21q-12-1-13 12" />
        <path d="m53 141-7-14-5 16-17 2 13 9-4 16 14-9 13 8-4-16 13-9Z" />
        <path d="m273 115 12 9-6 21-6-11-13 2Z" fill="var(--sketch-clay)" />
        <path d="M266 176c20-23 46-19 39-4-6 10-17-1-7-5 13-6 22 6 16 17m-10 0 9 2 5-10" />
        <path d="M29 202q20 6 32-4m-9-4 9 4-5 8 M153 213l3 2" />
      </g>
    </svg>
  );
}
