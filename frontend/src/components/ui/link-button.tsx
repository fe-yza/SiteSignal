import Link, { type LinkProps } from "next/link";
import type { AnchorHTMLAttributes, ReactNode } from "react";

import { buttonClasses } from "@/components/ui/button";

type Variant = Parameters<typeof buttonClasses>[0] extends infer P
  ? P extends { variant?: infer V }
    ? V
    : never
  : never;
type Size = Parameters<typeof buttonClasses>[0] extends infer P
  ? P extends { size?: infer S }
    ? S
    : never
  : never;

interface LinkButtonProps
  extends LinkProps,
    Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
}

export function LinkButton({ variant, size, className, children, ...props }: LinkButtonProps) {
  return (
    <Link className={buttonClasses({ variant, size, className })} {...props}>
      {children}
    </Link>
  );
}
