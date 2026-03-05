import { ErrorServerMapper } from "@/@types/general";
import { FieldValues, UseFormReturn } from "react-hook-form";

export function serverErrorMapper<T extends FieldValues>(
  form: UseFormReturn<T>,
  errorList: ErrorServerMapper<T>,
  status?: number,
) {
  if (!status) return;

  const mapped = errorList[status];
  const { fields, formError } = mapped;
  if (fields) {
    fields.forEach((field) => {
      form.setError(field.name, field.errorOption);
    });
  }

  if (formError) {
    form.setError("root", {
      type: "server",
      message: formError,
    });
  }
}
