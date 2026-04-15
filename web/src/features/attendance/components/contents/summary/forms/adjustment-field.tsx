import { FormFieldNumber } from "@/components/forms/form-field-number";
import {
  FormFieldSelect,
  FormFieldSelectOptions,
} from "@/components/forms/form-field-select";
import { FormFieldText } from "@/components/forms/form-field-text";
import { FormFieldTextArea } from "@/components/forms/form-field-textarea";
import { Button } from "@/components/ui/button";
import { ActivityAdjustmentListDb } from "@/features/attendance/interfaces/activity-adjustment-list.interface";
import { AttendanceLogsAdjustmentType } from "@/features/attendance/schema/attendance-logs-adjustment.schema";
import { useFetch } from "@/hooks/use-fetch";
import { Plus, Trash2 } from "lucide-react";
import React, { useEffect, useMemo } from "react";
import { useFieldArray, UseFormReturn, useWatch } from "react-hook-form";

interface Props {
  form: UseFormReturn<AttendanceLogsAdjustmentType>;
}

export function AdjustmentField({ form }: Props) {
  const { data = [] } = useFetch<ActivityAdjustmentListDb[]>(
    "/api/attendance/list-note",
  );

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
        label: "Buat data baru",
      },
    ],
    [data],
  );

  return (
    <div className="space-y-4 border border-white p-4 rounded-2xl">
      <p className="font-semibold text-sm">Penyesuaian</p>
      <div className="flex justify-end gap-4">
        <Button
          variant="accent"
          size="icon-sm"
          type="button"
          onClick={() => append({ added_minutes: 0, id: 0 })}
        >
          <Plus />
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {fields.map((field, index) => (
          <IDCombobox
            key={field.id}
            dataWithAddOption={dataWithAddOption}
            index={index}
            form={form}
            onRemove={() => remove(index)}
            data={data}
          />
        ))}
      </div>
    </div>
  );
}

const IDCombobox: React.FC<{
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
    }
  }, [selectedId, data, setValue, index]);
  return (
    <div className="space-y-4 border p-4 rounded-2xl">
      <div className="flex items-center justify-between">
        <p className="font-semibold text-sm">Penyesuaian {index + 1}</p>
        <Button variant="ghost" size="icon-sm" type="button" onClick={onRemove}>
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
      <FormFieldSelect
        form={form}
        label="Nama Penyesuaian"
        placeholder="Pilih penyesuaian"
        name={`adjustment.${index}.id`}
        options={dataWithAddOption}
      />
      {isCreateNewId && (
        <>
          <FormFieldText
            form={form}
            label="Nama Penyesuaian"
            placeholder="Misal : Cuti"
            name={`adjustment.${index}.adjusment_name`}
          />
          <FormFieldTextArea
            form={form}
            label="Nama Penyesuaian"
            placeholder="Misal : Cuti"
            name={`adjustment.${index}.adjusment_description`}
          />
        </>
      )}
      <FormFieldNumber
        form={form}
        label="Jumlah Penyesuaian (Satuan Menit)"
        name={`adjustment.${index}.added_minutes`}
      />
    </div>
  );
};
