import { useNavigation } from "@remix-run/react";
import { IconLoader } from "@tabler/icons-react";
import { useSpinDelay } from "spin-delay";

import { cn } from "~/lib/utils";

export function GlobalLoader() {
  const navigation = useNavigation();
  const showSpinner = useSpinDelay(navigation.state !== "idle");

  return (
    <IconLoader
      className={cn(
        showSpinner ? "animate-spin opacity-100" : "opacity-0",
        "ml-2 text-muted-foreground transition-opacity",
      )}
    />
  );
}
