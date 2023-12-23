import { IconInfoCircleFilled } from "@tabler/icons-react";

import { cn } from "~/lib/utils";

interface Props extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}
export function Callout({ children, className, ...props }: Props) {
  return (
    <div
      className={cn("rounded-md border border-primary bg-primary/5 px-3 py-2 text-sm font-medium", className)}
      {...props}
    >
      <div>
        <IconInfoCircleFilled className="h-4 w-4 text-primary" />
      </div>
      <div className="mt-2">{children}</div>
    </div>
  );
}
