import { FormFieldText } from "@/components/forms/form-field-text";
import { FormFieldTextArea } from "@/components/forms/form-field-textarea";
import { FormFieldTimePicker } from "@/components/forms/form-field-time-picker";
import { Button } from "@/components/ui/button";
import {
  defaultListSchema,
  listSchema,
  ListSchemaInput,
  ListSchemaType,
} from "@/features/attendance/schema/list-schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

interface Props {
  defaultValues?: ListSchemaInput;
  submitHandler: (values: ListSchemaType) => Promise<void> | void;
}

export function ListNoteForm({ submitHandler, defaultValues }: Props) {
  const form = useForm<ListSchemaInput, unknown, ListSchemaType>({
    defaultValues: defaultValues ?? defaultListSchema,
    resolver: zodResolver(listSchema),
  });
  return (
    <form
      onSubmit={form.handleSubmit(submitHandler, () =>
        alert(
          "Data yang diminta belum lengkap. Pastikan Konfigurasi Kategori juga diisi",
        ),
      )}
      className="space-y-4"
    >
      <div className="grid grid-cols-2 gap-4">
        <FormFieldText
          form={form}
          name="name"
          label="Nama Penyesuaian"
          placeholder="cth: Cuti, Libur Nasional, Sistem Error"
        />
        <FormFieldTimePicker
          form={form}
          name="added_minutes"
          label="Default Penyesuaian"
        />
      </div>
      <FormFieldTextArea
        form={form}
        name="notes"
        label="Deskripsi Penyesuaian"
        placeholder="cth: Penyesuaian untuk karyawan yang mengambil cuti atau libur nasional"
      />
      <Button variant={"accent"}>Simpan</Button>
    </form>
  );
}
