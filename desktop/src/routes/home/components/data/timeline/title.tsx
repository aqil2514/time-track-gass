import { Clock, LayoutGrid, ListTree } from "lucide-react";
import { cn } from "@/lib/utils";

interface TimelineTitleProps {
  mode: "session" | "category";
  onModeChange: (mode: "session" | "category") => void;
  isAutoMode: boolean;
}

export function TimelineTitle({ mode, onModeChange, isAutoMode }: TimelineTitleProps) {
  return (
    <div className="flex items-center justify-between w-full">
      {/* Kiri: Judul */}
      <div className="flex items-center gap-2">
        <div className="inline-flex items-center justify-center size-7 rounded-lg bg-purple-500/15 border border-purple-500/20">
          <Clock className="w-4 h-4 text-purple-400" strokeWidth={2.5} />
        </div>
        <h3 className="font-semibold text-white tracking-tight">
          Activity Timeline
        </h3>
      </div>

      {isAutoMode && <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-1">
        <button
          onClick={() => onModeChange("session")}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1 text-[11px] font-bold uppercase tracking-wider rounded-md transition-all duration-200",
            mode === "session"
              ? "bg-purple-500 text-white shadow-lg shadow-purple-500/20"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800",
          )}
        >
          <ListTree className="w-3 h-3" />
          Sesi
        </button>

        <button
          onClick={() => onModeChange("category")}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1 text-[11px] font-bold uppercase tracking-wider rounded-md transition-all duration-200",
            mode === "category"
              ? "bg-purple-500 text-white shadow-lg shadow-purple-500/20"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800",
          )}
        >
          <LayoutGrid className="w-3 h-3" />
          Kategori
        </button>
      </div>}
    </div>
  );
}
