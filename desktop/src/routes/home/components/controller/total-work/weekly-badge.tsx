import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"; // Import shadcn tooltip
import { cn } from "@/lib/utils";
import { ActivityAdjustment } from "@/routes/home/types/activites-data.type";
import { formatToTime } from "@/utils/format-to-time";
import { CalendarDays } from "lucide-react";
import { useMemo } from "react";

interface Props {
  isLoading: boolean;
  weeklyMinutes: number;
  activityAdjustment: ActivityAdjustment[];
}

export function WeeklyBadge({ isLoading, weeklyMinutes, activityAdjustment }: Props) {
  const totalAdjustment = useMemo(
    () => activityAdjustment.reduce((acc, curr) => acc + curr.affected_minutes, 0),
    [activityAdjustment],
  );

  const totalMinutes = totalAdjustment + weeklyMinutes;

  return (
    <TooltipProvider>
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          <Badge
            variant="outline"
            className={cn(
              "flex items-center gap-2.5 border-slate-700 bg-slate-900/50 px-3 py-1.5 h-10.5 transition-all cursor-help",
              isLoading && "opacity-70"
            )}
          >
            <CalendarDays className="w-4 h-4 text-slate-400 shrink-0" />
            <div className="flex flex-col items-start min-w-15">
              <span className="text-[9px] leading-none uppercase text-slate-500 font-bold mb-1">
                Mingguan
              </span>
              {isLoading ? (
                <Skeleton className="h-3 w-12 bg-slate-700" />
              ) : (
                <div className="text-xs font-semibold text-slate-200 leading-none">
                  {formatToTime(totalMinutes, "minutes")}
                </div>
              )}
            </div>
          </Badge>
        </TooltipTrigger>

        <TooltipContent side="bottom" className="p-3 bg-slate-900 border-slate-800 text-white">
          <div className="space-y-1.5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Rincian Mingguan
            </p>
            
            <div className="flex justify-between gap-6 text-xs">
              <span className="text-slate-400">Total Dasar:</span>
              <span className="font-mono text-slate-200">
                {formatToTime(weeklyMinutes, "minutes")}
              </span>
            </div>

            <div className="flex justify-between gap-6 text-xs">
              <span className="text-slate-400">Akumulasi Penyesuaian:</span>
              <span className={cn(
                "font-mono",
                totalAdjustment >= 0 ? "text-emerald-400" : "text-rose-400"
              )}>
                {totalAdjustment > 0 ? "+" : ""}
                {formatToTime(totalAdjustment, "minutes")}
              </span>
            </div>

            <div className="h-px bg-slate-800 my-1" />

            <div className="flex justify-between gap-6 text-xs font-bold">
              <span className="text-slate-200">Total Akhir:</span>
              <span className="text-indigo-400">
                {formatToTime(totalMinutes, "minutes")}
              </span>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}