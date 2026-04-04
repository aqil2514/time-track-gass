import { UseFormReturn } from "react-hook-form";
import { AddUserSchema } from "../../schema/user-schema";
import { FormFieldSelect } from "@/components/forms/form-field-select";
import { useDivisions } from "@/features/divisions/hooks/use-divisions";
import { LabelValue } from "@/@types/general";

interface Props {
  form: UseFormReturn<AddUserSchema>;
}

export function DivisionForm({ form }: Props) {
  const { data, isLoading } = useDivisions();

  const selectItems: LabelValue[] = (data || [])
    .filter((d) => d.id !== 8)
    .map((d) => ({
      label: d.name,
      value: String(d.id),
    }));

  return (
    <FormFieldSelect
      form={form}
      label="Divisi"
      name="division"
      placeholder={isLoading ? "Memuat data divisi..." : "Pilih divisi"}
      options={selectItems}
    />
  );
}
