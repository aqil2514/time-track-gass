import { Button } from "@/components/ui/button";
import {
  attendanceLogsAdjustmentSchema,
  AttendanceLogsAdjustmentType,
  defaultAttendanceLogsAdjustment,
} from "@/features/attendance/schema/attendance-logs-adjustment.schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { AdjustmentField } from "./adjustment-field";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ProfileImpactField } from "./profile-impact-field";
import { Form } from "@/components/ui/form";
import { AttendanceDateField } from "./attendance-date-field";

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
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(submitHandler, () =>
          alert(
            "Data yang diminta belum lengkap",
          ),
        )}
        className="space-y-4"
      >
        <ScrollArea className="h-96 px-4">
          <div className="space-y-4">

          <AttendanceDateField form={form} />
          <ProfileImpactField form={form} />
          <AdjustmentField form={form} />
          </div>
        </ScrollArea>
        <Button variant={"accent"} disabled={isSubmitting}>
          {isSubmitting ? "Menyimpan..." : "Simpan"}
        </Button>
      </form>
    </Form>
  );
}
