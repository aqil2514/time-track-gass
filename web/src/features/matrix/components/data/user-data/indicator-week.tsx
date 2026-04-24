import { MatrixResponse } from "@/features/matrix/types/matrix.types";
import { formatToTime } from "@/utils/format-to-time";
import { Clock } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Props {
  user: MatrixResponse;
}

export function WeekIndicator({ user }: Props) {
  // 1. Hitung total menit dari tracker murni
  const baseWeeklyMinutes = user.totalWeeklyActivity;

  // 2. Hitung total akumulasi adjustment dalam seminggu
  const totalAdjustmentMinutes = user.workAdjustment?.reduce(
    (acc, curr) => acc + curr.affected_minutes,
    0
  ) || 0;

  const hasWeeklyAdjustment = totalAdjustmentMinutes !== 0;

  // 3. Total akhir (Tracker + Akumulasi Adjustment)
  const finalWeeklyMinutes = baseWeeklyMinutes + totalAdjustmentMinutes;
  const totalWeekly = formatToTime(finalWeeklyMinutes, "minutes");

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex items-center gap-1.5 cursor-help group/week">
          <Clock
            className={`w-3 h-3 transition-colors ${
              hasWeeklyAdjustment ? "text-amber-500" : "text-slate-600"
            }`}
          />
          <span className="text-[10px] text-slate-400 font-mono">
            WEEK:{" "}
            <span
              className={
                hasWeeklyAdjustment ? "text-amber-500/90 font-bold" : "text-amber-500/40"
              }
            >
              ~{totalWeekly}
            </span>
          </span>
        </div>
      </TooltipTrigger>

      <TooltipContent
        side="right"
        className="bg-slate-950 border-slate-800 p-2 text-[10px] shadow-2xl min-w-45"
      >
        <div className="space-y-2">
          <div className="flex flex-col border-b border-white/5 pb-1.5">
            <span className="font-bold text-slate-200 uppercase tracking-tighter">Weekly Summary</span>
            <span className="text-slate-500">Accumulated performance</span>
          </div>

          <div className="space-y-1 font-mono">
            <div className="flex justify-between items-center text-slate-400">
              <span>Tracker Base:</span>
              <span>{formatToTime(baseWeeklyMinutes, "minutes")}</span>
            </div>

            {hasWeeklyAdjustment && (
              <div className="flex justify-between items-center">
                <span className="text-amber-500/80">Net Adjustments:</span>
                <span className={totalAdjustmentMinutes >= 0 ? "text-emerald-400" : "text-rose-400"}>
                  {formatToTime(totalAdjustmentMinutes, "minutes")}
                </span>
              </div>
            )}
          </div>

          <div className="flex justify-between items-center pt-1.5 border-t border-white/10">
            <span className="font-bold text-slate-300">ESTIMATED TOTAL:</span>
            <span className="font-bold text-amber-500">~{totalWeekly}</span>
          </div>

          {hasWeeklyAdjustment && (
            <p className="text-[9px] text-slate-600 italic leading-tight pt-1">
              *Total mencakup {user.workAdjustment?.length} penyesuaian manual minggu ini.
            </p>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  );
}