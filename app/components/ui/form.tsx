import { useId } from "react";
import { useField } from "remix-validated-form";

import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { Textarea } from "~/components/ui/textarea";
import { cn } from "~/lib/utils";

function FieldError({ id, error }: { id: string; error?: string }) {
  if (!error) return null;
  return (
    <p id={`${id}-error`} className="mt-0.5 text-xs font-medium text-destructive">
      {error}
    </p>
  );
}

interface FieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  name: string;
  label: string;
  isCurrency?: boolean;
  formId?: string;
  hideLabel?: boolean;
}
export function FormField({
  isCurrency = false,
  hideLabel = false,
  name,
  label,
  formId,
  className,
  ...props
}: FieldProps) {
  const fallbackId = useId();
  const { error, getInputProps } = useField(name, { formId });

  const id = props.id ?? fallbackId;

  return (
    <div className={cn("w-full", !hideLabel && "space-y-1")}>
      <Label htmlFor={id} className={cn(hideLabel && "sr-only")}>
        <span>{label}</span>
        <span className="ml-0.5 font-normal text-destructive">{props.required ? "*" : ""}</span>
      </Label>
      <Input
        id={id}
        inputMode={isCurrency ? "decimal" : props.inputMode}
        aria-invalid={error ? true : props["aria-invalid"]}
        aria-describedby={`${id}-error`}
        className={cn(error && "border-destructive", className)}
        {...getInputProps()}
        {...props}
      />
      <FieldError id={id} error={error} />
    </div>
  );
}
interface FormTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  name: string;
  label: string;
  formId?: string;
  hideLabel?: boolean;
}
export function FormTextarea({ hideLabel = false, name, label, formId, className, ...props }: FormTextareaProps) {
  const fallbackId = useId();
  const { error, getInputProps } = useField(name, { formId });

  const id = props.id ?? fallbackId;

  return (
    <div className={cn("w-full", !hideLabel && "space-y-1")}>
      <Label htmlFor={id} className={cn(hideLabel && "sr-only")}>
        <span>{label}</span>
        <span className="ml-0.5 font-normal text-destructive">{props.required ? "*" : ""}</span>
      </Label>
      <Textarea
        id={id}
        aria-invalid={error ? true : props["aria-invalid"]}
        aria-describedby={`${id}-error`}
        className={cn(error && "border-destructive", className)}
        {...getInputProps()}
        {...props}
      />
      <FieldError id={id} error={error} />
    </div>
  );
}

export interface FormSelectProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  name: string;
  label: string;
  placeholder: string;
  required?: boolean;
  id?: string;
  options?: Array<{ value: string | number | null; label: string | JSX.Element | null }>;
  children?: React.ReactNode;
}

export function FormSelect(props: FormSelectProps) {
  const { name, label, placeholder, options, ...rest } = props;
  const { error, getInputProps } = useField(name);
  const field = getInputProps({});
  const fallbackId = useId();
  const id = props.id ?? fallbackId;

  return (
    <div className="w-full space-y-1">
      <Label htmlFor={id}>
        <span>{label}</span>
        <span className="ml-0.5 font-normal text-destructive">{props.required ? "*" : ""}</span>
      </Label>
      <Select name={field.name} defaultValue={field.defaultValue as string | undefined} onValueChange={field.onChange}>
        <SelectTrigger id={id} {...rest}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options
            ? options.map((o) => {
                if (o.value === null || o.label === null) return null;

                return (
                  <SelectItem key={o.value} value={o.value.toString()}>
                    {o.label}
                  </SelectItem>
                );
              })
            : props.children}
        </SelectContent>
        <FieldError id={id} error={error} />
      </Select>
    </div>
  );
}
