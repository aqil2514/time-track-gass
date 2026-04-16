import { AdjustmentButton } from "./adjustment-button";
import { AdjustmentViewButton } from "./adjustment-view";
import { WorkSummaryFilter } from "./work-summary-filter";

export function SummaryController() {
  return (
    <div className="space-y-1">
      <WorkSummaryFilter />
      <div className="flex justify-end gap-2">
        <AdjustmentViewButton />
        <AdjustmentButton />
      </div>
    </div>
  );
}
