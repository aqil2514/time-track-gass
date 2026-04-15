import { ControlledDialogContainer } from "@/components/containers/controlled-dialog-container";
import { useQueryParams } from "@/hooks/use-query-params";
import { AdjustmentAttendanceForm } from "../forms";

export function AddAdjustmentDialog() {
  const { get, update } = useQueryParams();
  const open = get("action") === "add-adjustment";
  return (
    <ControlledDialogContainer
      title="Tambah Penyesuaian"
      description="Isi form di bawah ini untuk menambahkan penyesuaian absensi"
      open={open}
      onOpenChange={(open) => {
        if (!open) update({ action: null });
      }}
      className="sm:max-w-5xl"
    >
      <AdjustmentAttendanceForm submitHandler={(values) => console.log(values)} />
    </ControlledDialogContainer>
  );
}
