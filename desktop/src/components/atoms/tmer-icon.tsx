import { Timer } from "lucide-react";

export function TimerIcon() {
  return (
    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-500 mb-4 shadow-lg shadow-amber-500/25">
      <Timer className="w-8 h-8 text-slate-950" strokeWidth={2.5} />
    </div>
  );
}
