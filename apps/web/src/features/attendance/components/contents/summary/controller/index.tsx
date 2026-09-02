import { MutateButton } from "@/components/atoms/mutate-button";
import { AdjustmentButton } from "./adjustment-button";
import { AdjustmentViewButton } from "./adjustment-view";
import { WorkSummaryFilter } from "./work-summary-filter";
import { useSummaryAttendance } from "@/features/attendance/provider/summary.provider";
import { AttendanceDivisionFilter } from "./division-filter";

export function SummaryController() {
  const {mutate} = useSummaryAttendance()
  return (
    <div className="space-y-1">
      <WorkSummaryFilter />
      <AttendanceDivisionFilter />
      <div className="flex justify-end gap-2">
        <AdjustmentViewButton />
        <AdjustmentButton />
        <MutateButton mutate={mutate} />
      </div>
    </div>
  );
}
