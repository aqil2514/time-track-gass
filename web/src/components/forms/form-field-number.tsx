import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Controller, FieldValues } from "react-hook-form";
import { labelTextMapper } from "./form-constants";
import { BasicFormFieldProps } from "./form.interface";

export interface FormFieldNumberProps<
  T extends FieldValues,
  TTransformedValues extends FieldValues = T,
> extends BasicFormFieldProps<T, TTransformedValues> {
  min?: number;
  max?: number;
  step?: number;
}

export function FormFieldNumber<
  T extends FieldValues,
  TTransformedValues extends FieldValues = T,
>({
  form,
  name,
  label,
  placeholder = "0",
  className,
  textVariant = "default",
  min,
  max,
  step = 1,
}: FormFieldNumberProps<T, TTransformedValues>) {
  const isSubmitting = form.formState.isSubmitting;
  return (
    <FieldGroup>
      <Controller
        name={name}
        control={form.control}
        render={({ field, fieldState }) => {
          return (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel
                htmlFor={field.name}
                className={labelTextMapper[textVariant]}
              >
                {label}
              </FieldLabel>
              <Input
                {...field}
                type="number"
                min={min}
                max={max}
                step={step}
                onChange={(e) => field.onChange(e.target.valueAsNumber)}
                disabled={isSubmitting}
                id={field.name}
                aria-invalid={fieldState.invalid}
                placeholder={placeholder}
                className={cn(
                  "bg-slate-800/60 border-slate-700 text-white placeholder:text-slate-500 focus:border-amber-500 focus:ring-amber-500/20 h-11 rounded-lg transition-colors",
                  className,
                )}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          );
        }}
      />
    </FieldGroup>
  );
}
