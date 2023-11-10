import { Form } from "@remix-run/react";

import { Button } from "~/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "~/components/ui/dialog";

export function ConfirmDestructiveModal({ open, onOpenChange, description }: { open: boolean; onOpenChange: (open: boolean) => void; description: string }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="destructive" type="submit" name="_action" value="delete" className="w-min">
          Delete
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Are you sure absolutely sure?</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:space-x-0">
          <Button variant="outline" type="submit" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Form method="post">
            <Button variant="destructive" name="_action" value="delete" type="submit">
              Confirm
            </Button>
          </Form>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
