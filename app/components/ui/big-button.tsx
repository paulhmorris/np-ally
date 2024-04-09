import { ButtonHTMLAttributes } from "react";

import { cn } from "~/lib/utils";

type Props = ButtonHTMLAttributes<HTMLButtonElement>;

export function BigButton({ children, className, ...props }: Props) {
  return (
    <button
      className={cn(
        "flex w-full items-center justify-between gap-2 rounded-md border p-6 text-left hover:bg-secondary",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
