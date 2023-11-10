import * as React from "react";
import { useField } from "remix-validated-form";

import { Label } from "~/components/ui/label";
import { cn } from "~/utils/utils";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  name: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, type, name, label, ...props }, ref) => {
  const { error, getInputProps } = useField(name);
  return (
    <div className="w-full space-y-1">
      <Label htmlFor={name}>{label}</Label>
      <input
        type={type}
        aria-invalid={error ? "true" : "false"}
        aria-describedby={error ? `${name}-error` : undefined}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        ref={ref}
        {...getInputProps({ id: name })}
        {...props}
      />
      {error ? (
        <p className="mt-0.5 text-xs font-medium text-destructive" id={`${name}-error`}>
          {error}
        </p>
      ) : null}
    </div>
  );
});
Input.displayName = "Input";

export { Input };
