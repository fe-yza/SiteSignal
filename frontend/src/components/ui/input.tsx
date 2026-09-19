import { type InputHTMLAttributes, forwardRef } from "react";

import { cn } from "@/lib/utils";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, invalid, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          "h-9 w-full rounded-md border bg-surface px-3 text-sm text-foreground placeholder:text-muted transition-colors duration-150",
          "focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-1",
          invalid ? "border-critical" : "border-border hover:border-border-strong",
          className
        )}
        aria-invalid={invalid}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";
