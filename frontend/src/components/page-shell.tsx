import type { ReactNode } from "react";

export function PageShell({
  title,
  description,
  actions,
  children,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto max-w-5xl px-5 py-12 sm:px-8 sm:py-16">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="editorial-title text-4xl text-foreground">{title}</h1>
          {description && <p className="mt-4 max-w-2xl text-sm text-muted">{description}</p>}
        </div>
        {actions}
      </div>
      <div className="mt-10">{children}</div>
    </div>
  );
}
