import { useFetcher } from "@remix-run/react";
import { IconHelpCircle } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { ValidatedForm } from "remix-validated-form";

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
import { FormField, FormSelect, FormTextarea } from "~/components/ui/form";
import { SelectItem } from "~/components/ui/select";
import { SubmitButton } from "~/components/ui/submit-button";
import { LinearLabelID } from "~/lib/constants";
import { validator } from "~/routes/resources.issues";

export function IssueDialog() {
  const fetcher = useFetcher<{ success: boolean }>();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (fetcher.data?.success) {
      setIsOpen(false);
    }
  }, [fetcher.data]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="group absolute bottom-4 right-4 z-50 opacity-75 hover:opacity-100"
        >
          <IconHelpCircle className="h-5 w-5 opacity-75 transition-colors group-hover:opacity-100" />
          <span className="sr-only">Report Issue</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Report Issue</DialogTitle>
          <DialogDescription>Report a bug, or request an improvement or feature.</DialogDescription>
        </DialogHeader>
        <ValidatedForm
          id="issue-form"
          fetcher={fetcher}
          navigate={false}
          method="post"
          action="/resources/issues"
          validator={validator}
          className="grid gap-4 py-4"
        >
          <FormField name="title" label="Title" placeholder="I need help with..." required />
          <FormSelect name="labelId" label="Type" placeholder="Select issue type" required>
            <SelectItem value={LinearLabelID.Bug}>Bug</SelectItem>
            <SelectItem value={LinearLabelID.Feature}>Feature</SelectItem>
            <SelectItem value={LinearLabelID.Improvement}>Improvement</SelectItem>
          </FormSelect>
          <FormTextarea
            name="description"
            label="Description"
            placeholder="Please enter everything relevant to your issue."
            required
          />
          <DialogFooter>
            <Button type="button" onClick={() => setIsOpen(false)} variant="ghost" className="mr-auto">
              Cancel
            </Button>
            <SubmitButton type="submit">Submit</SubmitButton>
          </DialogFooter>
        </ValidatedForm>
      </DialogContent>
    </Dialog>
  );
}
