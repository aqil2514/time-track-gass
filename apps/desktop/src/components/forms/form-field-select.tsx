import { LabelValue } from "@/@types/general";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Controller, FieldValues } from "react-hook-form";
import { labelTextMapper } from "./form-constants";
import { BasicFormFieldProps } from "./form.interface";

export interface FormFieldSelectProps<T extends FieldValues>
  extends BasicFormFieldProps<T> {
  options: LabelValue[];
}

export function FormFieldSelect<T extends FieldValues>({
  form,
  name,
  label,
  placeholder = "Pilih opsi",
  options,
  className,
  textVariant = "default",
}: FormFieldSelectProps<T>) {
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

              <Select
                onValueChange={field.onChange}
                value={field.value}
                disabled={isSubmitting}
              >
                <SelectTrigger
                  id={field.name}
                  aria-invalid={fieldState.invalid}
                  className={cn(
                    "bg-slate-800/60 border-slate-700 text-white placeholder:text-slate-500 focus:border-amber-500 focus:ring-amber-500/20 h-11 rounded-lg transition-colors",
                    className
                  )}
                >
                  <SelectValue placeholder={placeholder} />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700 text-white">
                  {options.map((option) => (
                    <SelectItem 
                      key={option.value} 
                      value={option.value.toString()}
                      className="focus:bg-amber-500 focus:text-white"
                    >
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

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