import { Timer } from "lucide-react";
import { ProfileAvatar } from "./profile-avatar";

export function DashboardHeader() {
  return (
    <header className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 px-6 py-3 flex justify-between items-center">
      <div className="flex items-center gap-3">
        <div className="inline-flex items-center justify-center size-9 rounded-xl bg-linear-to-br from-purple-500 to-indigo-600 shadow-lg shadow-purple-500/20">
          <Timer className="w-4 h-4 text-white" strokeWidth={2.5} />
        </div>

        <div className="leading-tight">
          <div className="flex gap-1">
            <h1 className="text-lg font-semibold tracking-tight">
              <span className="text-white">Time</span>{" "}
              <span className="text-purple-400">Tracker</span>
            </h1>
            <p className="font-semibold text-xs text-white">V0.2.20</p>
          </div>
          <p className="text-slate-400 text-xs">
            Track every second that matters
          </p>
        </div>
      </div>

      <ProfileAvatar />
    </header>
  );
}
