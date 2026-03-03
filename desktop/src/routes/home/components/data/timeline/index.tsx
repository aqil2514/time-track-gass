import { TimelineItems } from "./items";
import { TimelineTitle } from "./title";

export function DataTimeline() {
  return (
    <div className="space-y-4">
      <TimelineTitle />
      <TimelineItems />
    </div>
  );
}