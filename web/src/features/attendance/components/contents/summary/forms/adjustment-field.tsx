import { FormFieldNumber } from "@/components/forms/form-field-number";
import {
  FormFieldSelect,
  FormFieldSelectOptions,
} from "@/components/forms/form-field-select";
import { FormFieldText } from "@/components/forms/form-field-text";
import { Button } from "@/components/ui/button";
import { ActivityAdjustmentListDb } from "@/features/attendance/interfaces/activity-adjustment-list.interface";
import { AttendanceLogsAdjustmentType } from "@/features/attendance/schema/attendance-logs-adjustment.schema";
import { useFetch } from "@/hooks/use-fetch";
import { Plus, Trash2, RefreshCw, AlertCircle, Loader2 } from "lucide-react";
import React, { useEffect, useMemo } from "react";
import { useFieldArray, UseFormReturn, useWatch } from "react-hook-form";
import { cn } from "@/lib/utils";

interface Props {
  form: UseFormReturn<AttendanceLogsAdjustmentType>;
}

export function AdjustmentField({ form }: Props) {
  const {
    data = [],
    error,
    isLoading,
    mutate,
  } = useFetch<ActivityAdjustmentListDb[]>("/api/attendance/list-note");

  const { fields, append, remove } = useFieldArray({
    name: "adjustment",
    control: form.control,
  });

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

  return (
    <div className="space-y-4 border border-slate-700 p-5 rounded-2xl bg-slate-900/40">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <p className="font-bold text-base text-white">Daftar Penyesuaian</p>
          <button
            type="button"
            onClick={() => mutate()}
            disabled={isLoading}
            className="text-slate-500 hover:text-amber-500 transition-colors"
          >
            <RefreshCw className={cn("w-3 h-3", isLoading && "animate-spin")} />
          </button>
        </div>

        <Button
          variant="accent"
          size="icon-sm"
          type="button"
          disabled={isLoading || !!error}
          onClick={() =>
            append({ added_minutes: 0, id: "-1", adjusment_name: "" })
          }
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-[11px] text-red-400 bg-red-400/10 p-2 rounded-lg border border-red-400/20">
          <AlertCircle className="w-3 h-3" />
          <span>Gagal memuat template penyesuaian.</span>
        </div>
      )}

      {fields.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 border-2 border-dashed border-slate-800 rounded-xl">
          {isLoading ? (
            <div className="flex items-center gap-2 text-slate-500">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-xs uppercase tracking-widest">
                Menyiapkan data...
              </span>
            </div>
          ) : (
            <>
              <p className="text-xs text-slate-500 italic uppercase tracking-wider">
                Belum ada penyesuaian yang ditambahkan
              </p>
              {form.formState.errors.adjustment && (
                <p className="text-xs text-red-400 mt-2">
                  {form.formState.errors.adjustment.message}
                </p>
              )}
            </>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {fields.map((field, index) => (
            <IDSelect
              key={field.id}
              dataWithAddOption={dataWithAddOption}
              index={index}
              form={form}
              onRemove={() => remove(index)}
              data={data}
            />
          ))}
        </div>
      )}
    </div>
  );
}

const IDSelect: React.FC<{
  dataWithAddOption: FormFieldSelectOptions[];
  index: number;
  form: UseFormReturn<AttendanceLogsAdjustmentType>;
  data: ActivityAdjustmentListDb[];
  onRemove: () => void;
}> = ({ dataWithAddOption, index, form, onRemove, data }) => {
  const selectedId = useWatch({
    control: form.control,
    name: `adjustment.${index}.id`,
  });
  const isCreateNewId = String(selectedId) === "-1";

  const { setValue } = form;

  useEffect(() => {
    const selected = data.find((d) => String(d.id) === String(selectedId));

    if (selected) {
      setValue(`adjustment.${index}.added_minutes`, selected.added_minutes);
      setValue(`adjustment.${index}.adjusment_name`, "");
    } else if (isCreateNewId) {
    }
  }, [selectedId, data, setValue, index, isCreateNewId]);

  return (
    <div className="space-y-4 border border-slate-700 p-4 rounded-2xl bg-slate-800/30 relative group">
      <div className="flex items-center justify-between">
        <p className="font-semibold text-xs text-amber-500 uppercase tracking-widest">
          Opsi #{index + 1}
        </p>
        <Button
          variant="ghost"
          size="icon-sm"
          type="button"
          onClick={onRemove}
          className="text-slate-500 hover:text-red-400 hover:bg-red-400/10 h-7 w-7"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>

      <FormFieldSelect
        form={form}
        label="Template Penyesuaian"
        placeholder="Pilih kategori..."
        name={`adjustment.${index}.id`}
        options={dataWithAddOption}
        className="bg-slate-900/50"
      />

      {isCreateNewId && (
        <FormFieldText
          form={form}
          label="Nama Custom"
          placeholder="Misal: Bonus Lembur Project"
          name={`adjustment.${index}.adjusment_name`}
          className="bg-slate-900/50"
        />
      )}

      <FormFieldNumber
        form={form}
        label="Durasi (Menit)"
        name={`adjustment.${index}.added_minutes`}
        className="bg-slate-900/50"
      />
    </div>
  );
};
