import { ActivityBreakdown } from "./activity-breakdown";
import { AIDailyInsight } from "./daily-insight";
import { DataTimeline } from "./timeline";

export function ActivityData() {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-4">
        <AIDailyInsight />
        <ActivityBreakdown />
      </div>
      <DataTimeline />
    </div>
  );
}
