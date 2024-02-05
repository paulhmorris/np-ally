import { useFetcher } from "@remix-run/react";
import { IconLoader, IconPlus } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { ValidatedForm } from "remix-validated-form";

import { Button } from "~/components/ui/button";
import { DrawerDialog, DrawerDialogFooter } from "~/components/ui/drawer-dialog";
import { FormField, FormTextarea } from "~/components/ui/form";
import { validator } from "~/routes/api.announcements";

export function NewAnnouncementModal() {
  const [open, setOpen] = useState(false);
  const fetcher = useFetcher<{ success: boolean }>();
  const isSubmitting = fetcher.state !== "idle";

  useEffect(() => {
    if (fetcher.data && !isSubmitting && fetcher.data.success) {
      setOpen(false);
    }
  }, [fetcher.data, isSubmitting]);

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <IconPlus className="size-4" />
        <span>New Announcement</span>
      </Button>
      <DrawerDialog title="New Announcement" open={open} setOpen={setOpen}>
        <ValidatedForm
          method="post"
          action="/api/announcements"
          validator={validator}
          fetcher={fetcher}
          id="announcement-form"
          className="space-y-4"
        >
          <FormField label="Title" name="title" type="text" required />
          <FormTextarea label="Content" name="content" required />
          <FormField
            label="Expires"
            name="expiresAt"
            type="date"
            description="Will disappear after midnight on this day"
            min={new Date().toISOString().split("T")[0]}
          />
          <DrawerDialogFooter className="mt-4">
            <Button variant="outline" type="submit" onClick={() => setOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? <IconLoader className="size-4 animate-spin" /> : null}
              <span>Submit</span>
            </Button>
          </DrawerDialogFooter>
        </ValidatedForm>
      </DrawerDialog>
    </>
  );
}
