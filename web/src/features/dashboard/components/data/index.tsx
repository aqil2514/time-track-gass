import { ActivityBreakdown } from "./activity-breakdown";
import { AIDailyInsight } from "./daily-insight";
import { DataTimeline } from "./timeline";

export function DashboardDataContent() {
  return (
    <div className="grid md:grid-cols-2 gap-4">
      <div className="space-y-4">
        <AIDailyInsight />
        <ActivityBreakdown />
      </div>
        <DataTimeline />
    </div>
  );
}
