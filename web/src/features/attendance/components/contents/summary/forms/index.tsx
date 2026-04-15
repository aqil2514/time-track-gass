import { Button } from "@/components/ui/button";
import {
  attendanceLogsAdjustmentSchema,
  AttendanceLogsAdjustmentType,
  defaultAttendanceLogsAdjustment,
} from "@/features/attendance/schema/attendance-logs-adjustment.schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { AdjustmentField } from "./adjustment-field";

interface Props {
  defaultValues?: AttendanceLogsAdjustmentType;
  submitHandler: (values: AttendanceLogsAdjustmentType) => Promise<void> | void;
}
export function AdjustmentAttendanceForm({
  submitHandler,
  defaultValues,
}: Props) {
  const form = useForm<AttendanceLogsAdjustmentType>({
    defaultValues: defaultValues ?? defaultAttendanceLogsAdjustment,
    resolver: zodResolver(attendanceLogsAdjustmentSchema),
  });

  const isSubmitting = form.formState.isSubmitting;

  return (
    <form
      onSubmit={form.handleSubmit(submitHandler, () =>
        alert(
          "Data yang diminta belum lengkap. Pastikan Konfigurasi Kategori juga diisi",
        ),
      )}
      className="space-y-4"
    >
      <AdjustmentField form={form} />
      <Button variant={"accent"} disabled={isSubmitting}>
        {isSubmitting ? "Menyimpan..." : "Simpan"}
      </Button>
    </form>
  );
}
