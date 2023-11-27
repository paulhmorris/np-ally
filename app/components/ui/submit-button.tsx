import { IconLoader } from "@tabler/icons-react";
import { useIsSubmitting } from "remix-validated-form";

import type { ButtonProps } from "~/components/ui/button";
import { Button } from "~/components/ui/button";

export function SubmitButton(props: ButtonProps & { formId?: string }) {
  const isSubmitting = useIsSubmitting(props.formId);
  const isDisabled = props.disabled || isSubmitting;

  return (
    <Button {...props} type="submit" disabled={isDisabled}>
      {isSubmitting ? <IconLoader className="mr-2 h-4 w-4 animate-spin" /> : null}
      {props.children}
    </Button>
  );
}
