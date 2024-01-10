import { IconAlertTriangleFilled, IconExclamationCircle, IconInfoCircleFilled } from "@tabler/icons-react";
import { VariantProps, cva } from "class-variance-authority";

import { cn } from "~/lib/utils";

interface Props extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof calloutVariants> {
  children: React.ReactNode;
}

const calloutVariants = cva("rounded-md border p-3 text-sm font-medium flex items-start gap-3", {
  variants: {
    variant: {
      info: "bg-primary/5 border-primary",
      warning: "bg-warning/5 border-warning text-warning-foreground",
      destructive: "bg-destructive/5 border-destructive text-destructive-foreground",
      outline: "border border-input bg-card text-card-foreground",
    },
  },
  defaultVariants: {
    variant: "info",
  },
});

export function Callout({ children, className, variant = "info", ...props }: Props) {
  return (
    <div className={cn(calloutVariants({ variant, className }))} {...props}>
      {variant !== "outline" ? (
        <div className="pt-[1px]">
          {variant === "info" ? (
            <IconInfoCircleFilled className="size-4 text-primary" />
          ) : variant === "warning" ? (
            <IconAlertTriangleFilled className="size-4 text-warning" />
          ) : variant === "destructive" ? (
            <IconExclamationCircle className="size-4 text-destructive" />
          ) : null}
        </div>
      ) : null}
      <p>{children}</p>
    </div>
  );
}
