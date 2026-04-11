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
import z from "zod";

export interface FormFieldTimePickerProps<
  T extends FieldValues,
  TTransformedValues extends FieldValues = T,
> extends BasicFormFieldProps<T, TTransformedValues> {
  datalist?: LabelValue[];
}

export const timeToMinutesSchema = z
  .string()
  .min(1, "Durasi wajib diisi")
  .transform((val, ctx) => {
    const parts = val.split(":").map(Number);

    if (parts.length < 2 || parts.some(isNaN)) {
      ctx.addIssue({
        code: "custom",
        message: "Format waktu tidak valid",
      });
      return z.NEVER;
    }

    const [hours, minutes] = parts;
    return hours * 60 + minutes;
  });

export function FormFieldTimePicker<
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
}: FormFieldTimePickerProps<T, TTransformedValues>) {
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
                type="time"
                step={60}
                disabled={isSubmitting}
                id={field.name}
                aria-invalid={fieldState.invalid}
                placeholder={placeholder}
                list={datalistId}
                className={cn(
                  "bg-slate-800/60 border-slate-700 text-white placeholder:text-slate-500 focus:border-amber-500 focus:ring-amber-500/20 h-11 rounded-lg transition-colors [&::-webkit-datetime-edit-ampm-field]:hidden",
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
