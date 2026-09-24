import { cn } from "@/lib/utils";

/** Original, deliberately irregular pen drawings. Decorative; never encode data. */
export function Doodle({ variant = "search", className }: {
  variant?: "search" | "links" | "page";
  className?: string;
}) {
  return (
    <svg viewBox="0 0 180 140" fill="none" aria-hidden="true" className={cn("w-36 text-foreground", className)}>
      <g stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
        {variant === "search" ? <>
          <path d="M24 29 Q76 24 128 30 L125 109 Q73 112 23 107 Z" fill="var(--sketch-sage)" />
          <path d="M23 44 Q73 40 127 45 M33 35l1 1m7-2 1 1m7-1 1 1 M36 59l38-2m-38 12 27-1m-28 12 18-1" />
          <path d="M116 61c-27-9-42 28-16 40 26 12 43-29 16-40Z" fill="var(--background)" />
          <path d="m122 99 25 25 6-6-27-23m-21-26c-8 0-13 8-12 14 M143 38l8-8m-7 19 14-1 M64 115q8 15 25 8m-7-4 7 4-7 5" />
        </> : variant === "links" ? <>
          <path d="M30 58 55 34q15-12 27 1 11 12-1 25L57 83Q44 94 32 83q-11-12-2-25Z" fill="var(--sketch-sage)" />
          <path d="m96 73 25-26q14-11 25 2 12 12 0 26l-23 24q-14 10-25-2-11-11-2-24Z" fill="var(--background)" />
          <path d="m60 65 51 9m-25 40 2 12m9-18 9 9 M33 22l-5-8m-8 18-11-2 M143 104q-4 17-21 16m6-6-6 6 8 3" />
        </> : <>
          <path d="m48 19 58 3 25 24-5 78-84-5Z" fill="var(--sketch-sage)" />
          <path d="m106 22-2 24 27 0M58 57l48 2m-49 13 44 1m-44 13 28 1m-29 13 37 1 M144 33l3-9 3 9 9 3-9 3-3 9-3-9-9-3Z M22 85l-8 4m12 6-6 9" />
        </>}
      </g>
    </svg>
  );
}
