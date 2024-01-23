import { useFetcher } from "@remix-run/react";
import { IconAlertTriangleFilled, IconLoader } from "@tabler/icons-react";
import { useEffect } from "react";

import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";

export function ConfirmDestructiveModal({
  open,
  onOpenChange,
  description,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  description: string;
}) {
  const fetcher = useFetcher();
  const isSubmitting = fetcher.state !== "idle";

  useEffect(() => {
    if (fetcher.data && !isSubmitting) {
      onOpenChange(false);
    }
  }, [fetcher.data, isSubmitting, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          type="submit"
          name="_action"
          value="delete"
          className="w-min hover:border-destructive hover:bg-destructive hover:text-destructive-foreground"
        >
          Delete
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <IconAlertTriangleFilled className="mb-2 h-8 w-8 self-center text-destructive" />
          <DialogTitle>Are you absolutely sure?</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:space-x-0">
          <Button variant="outline" type="submit" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <fetcher.Form method="delete">
            <Button variant="destructive" name="_action" value="delete" type="submit" disabled={isSubmitting}>
              {isSubmitting ? <IconLoader className="size-4 animate-spin" /> : null}
              <span>Confirm</span>
            </Button>
          </fetcher.Form>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
