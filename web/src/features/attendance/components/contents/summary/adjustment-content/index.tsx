import { SideLeft } from "./side-left";
import { SideRight } from "./side-right";

export function SummaryAdjustmentContent() {
  return (
    <div className="grid grid-cols-2 gap-4">
      <SideLeft />

      <SideRight />
    </div>
  );
}
