import type { ComponentPropsWithoutRef } from "react";

import { cn } from "~/lib/utils";

interface Props extends ComponentPropsWithoutRef<"header"> {
  title: string;
  description?: string;
  children?: React.ReactNode;
}

export function PageHeader(props: Props) {
  const { className, description, ...rest } = props;
  return (
    <>
      <header className={cn("flex w-full flex-wrap items-center justify-between gap-3", className)} {...rest}>
        <h1 className="text-4xl font-black">{props.title}</h1>
        {props.children}
      </header>
      {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
    </>
  );
}
