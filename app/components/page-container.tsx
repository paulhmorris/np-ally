import type { ComponentPropsWithoutRef } from "react";

import { cn } from "~/lib/utils";

interface Props extends ComponentPropsWithoutRef<"div"> {
  children?: React.ReactNode;
}

export function PageContainer(props: Props) {
  const { className, ...rest } = props;
  return (
    <>
      <div className={cn("mt-6 sm:mt-12", className)} {...rest}>
        {props.children}
      </div>
    </>
  );
}
