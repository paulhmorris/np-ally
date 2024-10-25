import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "~/lib/utils";

const badgeVariants = cva(
  "inline-flex border items-center rounded-full px-2.5 py-1 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        default: "bg-primary/5 text-primary",
        secondary: "bg-muted hover:bg-secondary/50",
        success: "bg-success/10 border-success/5 text-success",
        warning: "bg-warning border-warning text-warning-foreground",
        destructive: "bg-destructive/10 border-destructive/5 text-destructive",
        outline: "text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, children, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props}>
      <span className="inline-flex items-center gap-1.5">{children}</span>
    </div>
  );
}

export { Badge, badgeVariants };
