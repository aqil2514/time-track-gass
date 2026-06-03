import { Form } from "@/components/ui/form";
import {
  editAdjustmentSchema,
  EditAdjustmentType,
} from "@/features/attendance/schema/edit-adjustment.schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { AttendanceDateField } from "./attendance-date-field";
import { EditAdjustmentField } from "./edit-form-adjustment";
import { Button } from "@/components/ui/button";

interface Props {
  defaultValues: EditAdjustmentType;
  submitHandler: (data: EditAdjustmentType) => void | Promise<void>;
  onExistingImageRemove: () => void;
}

export function AdjustmentAttendanceForm({
  submitHandler,
  defaultValues,
  onExistingImageRemove,
}: Props) {
  const form = useForm<EditAdjustmentType>({
    defaultValues,
    resolver: zodResolver(editAdjustmentSchema),
  });

  const isSubmitting = form.formState.isSubmitting;

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(submitHandler, (error) => {
          alert("Ada data yang tidak lengkap");
          console.error(error);
        })}
        className="space-y-4"
      >
        <AttendanceDateField form={form} />
        <EditAdjustmentField
          form={form}
          existingImageUrl={defaultValues.exist_image}
          onExistingImageRemove={() => {
            onExistingImageRemove();
            form.setValue("exist_image", undefined);
          }}
        />

        <Button variant={"accent"} disabled={isSubmitting}>
          {isSubmitting ? "Menyimpan..." : "Simpan"}
        </Button>
      </form>
    </Form>
  );
}
