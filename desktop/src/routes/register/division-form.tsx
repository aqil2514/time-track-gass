import { LabelValue } from "@/@types/general";
import { FormFieldSelect } from "@/components/forms/form-field-select";
import { RegisterFormValues } from "@/features/auth/schema/register.schema";
import { useFetch } from "@/hooks/use-fetch";
import { buildUrl } from "@/utils/build-url";
import { useMemo } from "react";
import { UseFormReturn } from "react-hook-form";

interface Props {
  form: UseFormReturn<RegisterFormValues>;
}

export function DivisionForm({ form }: Props) {
  const url = buildUrl("auth/divisions");
  const { data } = useFetch<{ name: string; id: number }[]>(url);

  const selectItems = useMemo<LabelValue[]>(() => {
    if (!data) return [];

    return data.map((d) => ({ label: d.name, value: String(d.id) }));
  }, [data]);

  return (
    <FormFieldSelect textVariant="slate" form={form} label="Divisi" name="division" options={selectItems} />
  );
}
