import { useAdjustmentContent } from "@/features/attendance/provider/adjustment-content.provider";
import { EditAdjustmentType } from "@/features/attendance/schema/edit-adjustment.schema";
import { useMemo, useState } from "react";
import { AdjustmentAttendanceForm } from "../../../forms/edit-form";
import axios from "axios";
import { useSummaryAttendance } from "@/features/attendance/provider/summary.provider";
import { useFetch } from "@/hooks/use-fetch";
import { AdjustmentContentDetail } from "@/features/attendance/interfaces/activity-adjustment-list.interface";

export function SideRightEdit() {
  const { state, mutate, dispatch } = useAdjustmentContent();
  const { mutate: parentMutate } = useSummaryAttendance();
  const { data } = useFetch<AdjustmentContentDetail>(
    state.adjustmentId
      ? `/api/attendance/adjustment/${state.adjustmentId}`
      : null,
  );
  const [isImageRemoved, setIsImageRemoved] = useState(false);

  const selected = data;

  const formValues = useMemo<EditAdjustmentType | undefined>(() => {
    if (!selected) return undefined;

    return {
      added_minutes: selected.affected_minutes,
      date: selected.date,
      id: String(selected.adjustment.id),
      image: null,
      adjusment_name: selected.adjustment.name || undefined,
      exist_image: selected.s3_key || undefined,
    };
  }, [selected]);

  const handleSubmit = async (values: EditAdjustmentType) => {
    try {
      if (isImageRemoved) {
        values.exist_image = undefined;
      }
      await axios.patchForm(
        `/api/attendance/adjustment/${state.adjustmentId}`,
        values,
      );
      await mutate();
      await parentMutate();
      alert("Penyesuaian berhasil diperbarui.");
      dispatch({
        type: "SET_ACTION",
        payload: { action: "standby", adjustmentId: null },
      });
    } catch (error) {
      console.error("Error updating adjustment:", error);
      alert("Gagal memperbarui penyesuaian. Silakan coba lagi.");
      return;
    }
  };

  if (!formValues) return null;

  return (
    <div className="space-y-4 rounded-2xl border border-slate-700/60 bg-slate-900/40 p-6 shadow-sm shadow-slate-950/20">
      <div className="space-y-2">
        <p className="text-sm uppercase tracking-[0.24em] text-slate-500">
          Edit Penyesuaian
        </p>
        <p className="text-lg font-semibold text-slate-100">
          Untuk user {selected?.profile.full_name}
        </p>
      </div>
      <AdjustmentAttendanceForm
        defaultValues={formValues}
        submitHandler={handleSubmit}
        onExistingImageRemove={() => setIsImageRemoved(true)}
      />
    </div>
  );
}
