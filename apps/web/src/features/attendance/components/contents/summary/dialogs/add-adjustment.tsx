import { ControlledDialogContainer } from "@/components/containers/controlled-dialog-container";
import { useQueryParams } from "@/hooks/use-query-params";
import { AdjustmentAttendanceForm } from "../forms";
import { AttendanceLogsAdjustmentType } from "@/features/attendance/schema/attendance-logs-adjustment.schema";
import axios from "axios";
import { useSummaryAttendance } from "@/features/attendance/provider/summary.provider";

export function AddAdjustmentDialog() {
  const { get, update } = useQueryParams();
  const { mutate } = useSummaryAttendance();
  const open = get("action") === "add-adjustment";

  const handleAdd = async (values: AttendanceLogsAdjustmentType) => {
    try {
      await axios.postForm("/api/attendance/adjustment", values);
      await mutate();
      alert("Data penyesuaian berhasil ditambah");
      update({ action: null });
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

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
      <AdjustmentAttendanceForm submitHandler={handleAdd} />
    </ControlledDialogContainer>
  );
}
