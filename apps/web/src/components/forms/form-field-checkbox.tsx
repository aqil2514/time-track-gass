import { LabelValue } from "@/@types/general";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Checkbox } from "@/components/ui/checkbox"; // Asumsi path checkbox UI Anda
import { cn } from "@/lib/utils";
import { Controller, FieldValues } from "react-hook-form";
import { labelTextMapper } from "./form-constants";
import { BasicFormFieldProps } from "./form.interface";

export interface FormFieldCheckboxOptions extends LabelValue {
  disabled?: boolean;
}

export interface FormFieldCheckboxProps<
  T extends FieldValues,
  TTransformedValues extends FieldValues = T,
> extends BasicFormFieldProps<T, TTransformedValues> {
  options: FormFieldCheckboxOptions[];
  disabled?: boolean;
}

export function FormFieldCheckboxGroup<
  T extends FieldValues,
  TTransformedValues extends FieldValues = T,
>({
  form,
  name,
  label,
  options,
  disabled,
  className,
  textVariant = "default",
}: FormFieldCheckboxProps<T, TTransformedValues>) {
  const isSubmitting = form.formState.isSubmitting;

  return (
    <FieldGroup>
      <Controller
        name={name}
        control={form.control}
        render={({ field, fieldState }) => {
          const fieldValue = (Array.isArray(field.value) ? field.value : []) as string[];

          return (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel
                className={cn("mb-3 block", labelTextMapper[textVariant])}
              >
                {label}
              </FieldLabel>

              <div className={cn("grid grid-cols-1 md:grid-cols-2 gap-4", className)}>
                {options.map((option) => {
                  const isChecked = fieldValue.includes(option.value.toString());

                  return (
                    <div
                      key={option.value}
                      className="flex flex-row items-start space-x-3 space-y-0 rounded-md border border-slate-700 bg-slate-800/40 p-3 transition-colors hover:border-amber-500/50"
                    >
                      <Checkbox
                        id={`${field.name}-${option.value}`}
                        checked={isChecked}
                        disabled={isSubmitting || disabled || option.disabled}
                        onCheckedChange={(checked) => {
                          const updatedValue = checked
                            ? [...fieldValue, option.value.toString()]
                            : fieldValue.filter((v: string) => v !== option.value.toString());
                          
                          field.onChange(updatedValue);
                        }}
                        className="border-slate-500 data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-500"
                      />
                      <div className="grid gap-1.5 leading-none cursor-pointer">
                        <label
                          htmlFor={`${field.name}-${option.value}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-white cursor-pointer"
                        >
                          {option.label}
                        </label>
                      </div>
                    </div>
                  );
                })}
              </div>

              {fieldState.invalid && (
                <FieldError errors={[fieldState.error]} />
              )}
            </Field>
          );
        }}
      />
    </FieldGroup>
  );
}