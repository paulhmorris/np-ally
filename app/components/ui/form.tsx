import { FormConfig, useForm as useConform } from "@conform-to/react";
import { getFieldsetConstraint, parse } from "@conform-to/zod";
import { useId } from "react";
import { useField } from "remix-validated-form";
import { z } from "zod";

import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";

export type ListOfErrors = Array<null | string | undefined> | null | undefined;

export function ErrorList({ errors, id }: { errors?: ListOfErrors; id?: string }) {
  const errorsToRender = errors?.filter(Boolean);
  if (!errorsToRender?.length) return null;
  return (
    <ul className="flex flex-col gap-1" id={id}>
      {errorsToRender.map((e) => (
        <li className="text-xs font-semibold text-destructive" key={e}>
          {e}
        </li>
      ))}
    </ul>
  );
}

interface FieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  name: string;
  errors?: ListOfErrors;
  isCurrency?: boolean;
  label: string;
}
export function Field({ isCurrency = false, name, label, ...props }: FieldProps) {
  const fallbackId = useId();
  const { error, getInputProps } = useField(name);

  const id = props.id ?? fallbackId;

  return (
    <div className="w-full space-y-1">
      <Label htmlFor={id}>
        <Label htmlFor={id}>
          <span>{label}</span>
          <span className="ml-0.5 font-normal text-destructive">{props.required ? "*" : ""}</span>
        </Label>
      </Label>
      <Input
        id={id}
        inputMode={isCurrency ? "decimal" : undefined}
        aria-invalid={error ? true : undefined}
        aria-describedby={`${id}-error`}
        {...getInputProps()}
        {...props}
      />
      {error ? (
        <p className="mt-0.5 text-xs font-medium text-destructive" id={`${id}-error`}>
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function useForm<S extends z.ZodTypeAny>({ schema, ...config }: { schema: S } & FormConfig<z.infer<S>>) {
  return useConform<z.infer<S>>({
    constraint: getFieldsetConstraint(schema),
    onValidate({ formData }) {
      return parse(formData, { schema });
    },
    shouldRevalidate: "onSubmit",
    ...config,
  });
}
