import { ErrorOption, FieldValues, Path } from "react-hook-form";

export interface LabelValue<T extends string = string> {
  label: string;
  value: T;
}

export interface ErrorServerMapper<T extends FieldValues> {
  [status: number]: {
    fields?: {
      name: Path<T>;
      errorOption: ErrorOption;
    }[];
    formError?: string;
  };
}