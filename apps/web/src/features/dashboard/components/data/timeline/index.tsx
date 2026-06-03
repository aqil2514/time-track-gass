import { ActivityProvider } from "@/features/activity/provider/activity.provider";
import { TimelineItems } from "./items";
import { TimelineTitle } from "./title";
import { DetailDialog as ActivityDetailDialog } from "@/features/activity/dialogs/detail";

export function DataTimeline() {
  return (
    <ActivityProvider>
      <div className="space-y-4">
        <TimelineTitle />
        <TimelineItems />
      </div>

      <ActivityDetailDialog />
    </ActivityProvider>
  );
}
