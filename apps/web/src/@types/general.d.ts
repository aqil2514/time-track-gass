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

export type BaseModalOpen = "detail" | "edit" | "delete" | "add" | null

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}