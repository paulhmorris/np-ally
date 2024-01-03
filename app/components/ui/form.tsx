import { IconCurrencyDollar } from "@tabler/icons-react";
import { useId } from "react";
import { useControlField, useField } from "remix-validated-form";

import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { Textarea } from "~/components/ui/textarea";
import { cn } from "~/lib/utils";

function FieldError({ id, error }: { id: string; error?: string }) {
  if (!error) return null;
  return (
    <p id={`${id}-error`} className="ml-1 mt-1 text-xs font-medium text-destructive">
      {error}
    </p>
  );
}

function FieldDescription({ id, description }: { id: string; description?: string }) {
  if (!description) return null;
  return (
    <p id={`${id}-description`} className="mt-1 text-xs text-muted-foreground">
      {description}
    </p>
  );
}

interface FieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  name: string;
  label: string;
  description?: string;
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
    <div className={cn("relative w-full")}>
      <Label
        htmlFor={id}
        className={cn(
          hideLabel ? "sr-only" : "mb-1.5",
          error && "text-destructive",
          props.disabled && "cursor-not-allowed opacity-50",
        )}
      >
        <span>{label}</span>
        <span className="ml-1 inline-block font-normal text-destructive">{props.required ? "*" : ""}</span>
      </Label>
      <Input
        id={id}
        inputMode={isCurrency ? "decimal" : props.inputMode}
        aria-invalid={error ? true : props["aria-invalid"]}
        aria-describedby={`${id}-error`}
        className={cn(error && "border-destructive focus-visible:ring-destructive/50", isCurrency && "pl-7", className)}
        {...getInputProps()}
        onBlur={(e) => {
          if (isCurrency) {
            const value = parseFloat(e.currentTarget.value);
            if (isNaN(value)) {
              e.currentTarget.value = "";
            } else {
              e.currentTarget.value = value.toFixed(2);
            }
          }
          props.onBlur?.(e);
        }}
        {...props}
      />
      {isCurrency ? (
        <span className="pointer-events-none absolute left-2 top-9 text-muted-foreground">
          <IconCurrencyDollar className="h-4 w-4 text-muted-foreground" strokeWidth={2.5} />
        </span>
      ) : null}
      <FieldDescription id={id} description={props.description} />
      <FieldError id={id} error={error} />
    </div>
  );
}
interface FormTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  name: string;
  label: string;
  description?: string;
  formId?: string;
  hideLabel?: boolean;
}
export function FormTextarea({ hideLabel = false, name, label, formId, className, ...props }: FormTextareaProps) {
  const fallbackId = useId();
  const { error, getInputProps } = useField(name, { formId });

  const id = props.id ?? fallbackId;

  return (
    <div className={cn("relative w-full")}>
      <Label
        htmlFor={id}
        className={cn(
          hideLabel ? "sr-only" : "mb-1.5",
          error && "text-destructive",
          props.disabled && "cursor-not-allowed opacity-50",
        )}
      >
        <span>{label}</span>
        <span className="ml-1 inline-block font-normal text-destructive">{props.required ? "*" : ""}</span>
      </Label>
      <Textarea
        id={id}
        aria-invalid={error ? true : props["aria-invalid"]}
        aria-describedby={`${id}-error`}
        className={cn(error && "border-destructive", className)}
        {...getInputProps()}
        {...props}
      />
      <FieldDescription id={id} description={props.description} />
      <FieldError id={id} error={error} />
    </div>
  );
}

export interface FormSelectProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  name: string;
  label: string;
  placeholder: string;
  description?: string;
  required?: boolean;
  id?: string;
  options?: Array<{ value: string | number | null; label: string | JSX.Element | null }>;
  hideLabel?: boolean;
  divProps?: React.HTMLAttributes<HTMLDivElement>;
  children?: React.ReactNode;
}

export function FormSelect(props: FormSelectProps) {
  const { name, label, placeholder, options, hideLabel, divProps, ...rest } = props;
  const { error, getInputProps, validate } = useField(name);
  const field = getInputProps({});
  const fallbackId = useId();
  const id = props.id ?? fallbackId;
  const [value, setValue] = useControlField<string>(name);

  return (
    <div {...divProps} className={cn("relative w-full", divProps?.className)}>
      <Label
        htmlFor={id}
        className={cn(
          hideLabel ? "sr-only" : "mb-1",
          error && "text-destructive",
          props.disabled && "cursor-not-allowed opacity-50",
        )}
      >
        <span>{label}</span>
        <span className="ml-1 inline-block font-normal text-destructive">{props.required ? "*" : ""}</span>
      </Label>
      {!props.required && value && !props.disabled ? (
        <button type="button" onClick={() => setValue("")} className="ml-1 text-xs font-bold text-primary">
          Clear
        </button>
      ) : null}
      <Select
        name={field.name}
        defaultValue={typeof field.defaultValue !== "undefined" ? String(field.defaultValue) : undefined}
        value={value}
        onValueChange={(e) => {
          setValue(e);
          field.onChange?.(e);
          validate();
        }}
      >
        <SelectTrigger id={id} {...rest} className={cn(error && "focus:ring-destructive/50", rest.className)}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options && options.length === 0 ? (
            // @ts-expect-error see https://github.com/radix-ui/primitives/issues/1569#issuecomment-1567414323
            <SelectItem value={null} disabled>
              No options
            </SelectItem>
          ) : null}
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
        <FieldDescription id={id} description={props.description} />
        <FieldError id={id} error={error} />
      </Select>
    </div>
  );
}
