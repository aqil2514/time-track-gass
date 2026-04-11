import { FieldValues, Path, UseFormReturn } from "react-hook-form";

export type LabelTextStyle = "default" | "slate";

export interface BasicFormFieldProps<
  T extends FieldValues,
  TTransformedValues extends FieldValues = T,
> {
  form: UseFormReturn<T, unknown, TTransformedValues>;
  name: Path<T>;
  label: string;
  placeholder?: string;
  className?: string;
  textVariant?: LabelTextStyle;
}
