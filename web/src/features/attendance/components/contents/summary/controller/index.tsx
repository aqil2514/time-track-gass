import { AdjustmentButton } from "./adjustment-button";
import { WorkSummaryFilter } from "./work-summary-filter";

export function SummaryController() {
  return (
    <div className="space-y-1">
      <WorkSummaryFilter />
      <div className="flex justify-end gap-4">
        <AdjustmentButton />
      </div>
    </div>
  );
}
