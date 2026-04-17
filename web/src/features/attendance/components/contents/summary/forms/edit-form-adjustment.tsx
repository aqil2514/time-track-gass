import { FormFieldNumber } from "@/components/forms/form-field-number";
import {
  FormFieldSelect,
  FormFieldSelectOptions,
} from "@/components/forms/form-field-select";
import { FormFieldText } from "@/components/forms/form-field-text";
import { ActivityAdjustmentListDb } from "@/features/attendance/interfaces/activity-adjustment-list.interface";
import { EditAdjustmentType } from "@/features/attendance/schema/edit-adjustment.schema";
import { useFetch } from "@/hooks/use-fetch";
import { useEffect, useMemo } from "react";
import { UseFormReturn, useWatch } from "react-hook-form";

interface Props {
  form: UseFormReturn<EditAdjustmentType>;
}

export function EditAdjustmentField({ form }: Props) {
  const {
    data = [],
    error,
    isLoading,
    mutate,
  } = useFetch<ActivityAdjustmentListDb[]>("/api/attendance/list-note");

  const dataWithAddOption = useMemo<FormFieldSelectOptions[]>(
    () => [
      ...data.map((d) => ({
        value: String(d.id),
        label: d.name,
      })),
      {
        value: "-1",
        label: "➕ Buat data baru",
      },
    ],
    [data],
  );

  const selectedId = useWatch({
    control: form.control,
    name: `id`,
  });

  const isCreateNewId = String(selectedId) === "-1";

    useEffect(() => {
      const selected = data.find((d) => String(d.id) === String(selectedId));
  
      if (selected) {
        form.setValue(`added_minutes`, selected.added_minutes);
        form.setValue(`adjusment_name`, "");
      } else if (isCreateNewId) {
      }
    }, [selectedId, data, isCreateNewId, form]);

  return (
    <div className="space-y-4 border border-slate-700 p-4 rounded-2xl bg-slate-800/30 relative group">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-slate-400">Pilih template atau isi custom jika tidak ada di daftar.</p>
        <button
          type="button"
          disabled={isLoading}
          onClick={() => mutate()}
          className="text-xs text-slate-400 hover:text-amber-400 disabled:opacity-50 transition"
        >
          {isLoading ? "Memuat..." : "Refresh"}
        </button>
      </div>

      <FormFieldSelect
        form={form}
        label="Template Penyesuaian"
        placeholder="Pilih kategori..."
        name={`id`}
        options={dataWithAddOption}
        className="bg-slate-900/50"
      />

      {error && (
        <p className="text-xs text-red-400">Gagal memuat template penyesuaian. Silakan klik refresh.</p>
      )}

      {isCreateNewId && (
        <FormFieldText
          form={form}
          label="Nama Custom"
          placeholder="Misal: Bonus Lembur Project"
          name={`adjusment_name`}
          className="bg-slate-900/50"
        />
      )}

      <FormFieldNumber
        form={form}
        label="Durasi (Menit)"
        name={`added_minutes`}
        className="bg-slate-900/50"
      />
    </div>
  );
}
