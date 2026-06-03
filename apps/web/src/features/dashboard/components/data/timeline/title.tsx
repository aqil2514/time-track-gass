import { Clock } from "lucide-react";

export function TimelineTitle() {
  return (
    <div className="flex items-center gap-2">
      <div className="inline-flex items-center justify-center size-7 rounded-lg bg-purple-500/15 border border-purple-500/20">
        <Clock className="w-4 h-4 text-purple-400" strokeWidth={2.5} />
      </div>

      <h3 className="font-semibold text-white tracking-tight">
        Activity Timeline
      </h3>
    </div>
  );
}
