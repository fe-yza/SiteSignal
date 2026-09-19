import { Loader2 } from "lucide-react";
import { type ButtonHTMLAttributes, forwardRef } from "react";

import { cn } from "@/lib/utils";

const variantClasses = {
  primary:
    "bg-accent text-accent-foreground hover:bg-accent-hover disabled:bg-accent/50",
  secondary:
    "bg-surface text-foreground border border-border hover:border-border-strong hover:bg-surface-subtle disabled:opacity-50",
  ghost:
    "text-foreground hover:bg-surface-subtle disabled:opacity-50",
  danger:
    "bg-critical text-white hover:opacity-90 disabled:opacity-50",
} as const;

const sizeClasses = {
  sm: "h-8 px-3 text-sm gap-1.5",
  md: "h-9 px-4 text-sm gap-2",
  lg: "h-10 px-5 text-[15px] gap-2",
} as const;

// Shared with any element that needs to look like a button but isn't one
// (e.g. a Next.js <Link> styled as a primary action).
export function buttonClasses({
  variant = "primary",
  size = "md",
  className,
}: {
  variant?: keyof typeof variantClasses;
  size?: keyof typeof sizeClasses;
  className?: string;
} = {}) {
  return cn(
    "inline-flex items-center justify-center rounded-md font-medium transition-colors duration-150 disabled:cursor-not-allowed",
    "focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2",
    variantClasses[variant],
    sizeClasses[size],
    className
  );
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variantClasses;
  size?: keyof typeof sizeClasses;
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant = "primary", size = "md", loading, disabled, children, ...props },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={buttonClasses({ variant, size, className })}
        {...props}
      >
        {loading && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
