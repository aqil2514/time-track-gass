import { LabelValue } from "@/@types/general";
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

export interface FormFieldTextProps<
  T extends FieldValues,
  TTransformedValues extends FieldValues = T,
> extends BasicFormFieldProps<T, TTransformedValues> {
  datalist?: LabelValue[];
}

export function FormFieldText<
  T extends FieldValues,
  TTransformedValues extends FieldValues = T,
>({
  form,
  name,
  label,
  placeholder = "Isi field ini",
  datalist,
  className,
  textVariant = "default",
}: FormFieldTextProps<T, TTransformedValues>) {
  const isSubmitting = form.formState.isSubmitting;
  return (
    <FieldGroup>
      <Controller
        name={name}
        control={form.control}
        render={({ field, fieldState }) => {
          const datalistId = datalist ? `${field.name}-list` : undefined;
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
                disabled={isSubmitting}
                id={field.name}
                aria-invalid={fieldState.invalid}
                placeholder={placeholder}
                list={datalistId}
                className={cn(
                  "bg-slate-800/60 border-slate-700 text-white placeholder:text-slate-500 focus:border-amber-500 focus:ring-amber-500/20 h-11 rounded-lg transition-colors",
                  className,
                )}
              />
              {datalist && (
                <datalist id={datalistId}>
                  {datalist.map((data) => (
                    <option
                      value={data.value}
                      label={data.label}
                      key={data.value}
                    />
                  ))}
                </datalist>
              )}
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          );
        }}
      />
    </FieldGroup>
  );
}
