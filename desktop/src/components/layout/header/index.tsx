import { LogoutButton } from "@/components/atoms/logout-button";
import { Timer } from "lucide-react";

export function DashboardHeader() {
  return (
    <header className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 px-6 py-3 flex justify-between items-center">
      <div className="flex items-center gap-3">
        <div className="inline-flex items-center justify-center size-8 rounded-2xl bg-amber-500 shadow-lg shadow-amber-500/25">
          <Timer className="w-4 h-4 text-slate-950" strokeWidth={2.5} />
        </div>

        <div className="leading-tight">
          <h1 className="text-lg font-semibold text-white tracking-tight">
            Time Tracker
          </h1>
          <p className="text-slate-400 text-xs">
            Track every second that matters
          </p>
        </div>
      </div>

      <LogoutButton />
    </header>
  );
}
