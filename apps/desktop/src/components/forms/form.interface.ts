import { FieldValues, Path, UseFormReturn } from "react-hook-form";

export type LabelTextStyle = "default" | "slate";

export interface BasicFormFieldProps<T extends FieldValues> {
  form: UseFormReturn<T>;
  name: Path<T>;
  label: string;
  placeholder?: string;
  className?: string;
  textVariant?: LabelTextStyle;
}
