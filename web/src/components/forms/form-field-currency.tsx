import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { cn } from "@/lib/utils";
import { Controller, FieldValues } from "react-hook-form";
import { labelTextMapper } from "./form-constants";
import { BasicFormFieldProps } from "./form.interface";
import CurrencyInput, { CurrencyInputProps } from "react-currency-input-field";
import z from "zod";

export interface FormFieldCurrencyProps<
  T extends FieldValues,
  TTransformedValues extends FieldValues = T,
>
  extends
    BasicFormFieldProps<T, TTransformedValues>,
    Omit<CurrencyInputProps, "name" | "form" | "label"> {
  currency?: string;
  locale?: string;
}

export const currencyToNumberSchema = (message = "Nominal wajib diisi") =>
  z
    .string()
    .min(1, message)
    .transform((val) => Number(val.replace(/[^0-9]/g, "")));

export function FormFieldCurrency<
  T extends FieldValues,
  TTransformedValues extends FieldValues = T,
>({
  form,
  name,
  label,
  placeholder = "0",
  className,
  textVariant = "default",
  currency = "IDR",
  locale = "id-ID",
  ...rest
}: FormFieldCurrencyProps<T, TTransformedValues>) {
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
              <CurrencyInput
                id={field.name}
                name={field.name}
                value={field.value}
                onValueChange={(value) => field.onChange(value ?? "")}
                onBlur={field.onBlur}
                disabled={isSubmitting}
                placeholder={placeholder}
                intlConfig={{ locale, currency }}
                aria-invalid={fieldState.invalid}
                className={cn(
                  "flex w-full rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 h-11 text-white text-sm",
                  "placeholder:text-slate-500",
                  "focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20",
                  "disabled:cursor-not-allowed disabled:opacity-50",
                  className,
                )}
                {...rest}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          );
        }}
      />
    </FieldGroup>
  );
}
