import { LabelValue } from "@/@types/general";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Controller, FieldValues } from "react-hook-form";
import { labelTextMapper } from "./form-constants";
import { BasicFormFieldProps } from "./form.interface";
import z from "zod";
import { TimePicker } from "../molecules/time-picker/time-picker";

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
  textVariant = "default",
}: FormFieldTimePickerProps<T, TTransformedValues>) {
  const isSubmitting = form.formState.isSubmitting;
  return (
    <FieldGroup>
      <Controller
        name={name}
        control={form.control}
        render={({ field, fieldState }) => {
          const toDate = (value: string): Date | undefined => {
            if (!value) return undefined;
            const [hours, minutes] = value.split(":").map(Number);
            const date = new Date();
            date.setHours(hours, minutes, 0, 0);
            return date;
          };

          const fromDate = (date: Date | undefined) => {
            if (!date) return field.onChange("");
            const hh = date.getHours().toString().padStart(2, "0");
            const mm = date.getMinutes().toString().padStart(2, "0");
            field.onChange(`${hh}:${mm}`);
          };

          return (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel
                htmlFor={field.name}
                className={labelTextMapper[textVariant]}
              >
                {label}
              </FieldLabel>
              <TimePicker
                date={toDate(field.value)}
                setDate={fromDate}
                disabled={isSubmitting}
                show={["hours", "minutes"]}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          );
        }}
      />
    </FieldGroup>
  );
}
