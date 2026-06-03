import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useHomeContext } from "@/routes/home/store/home.provider";
import { ActivityAdjustment } from "@/routes/home/types/activites-data.type";
import { formatToTime } from "@/utils/format-to-time";
import { format } from "date-fns";
import { Clock } from "lucide-react";
import { useMemo } from "react";

interface Props {
  isLoading: boolean;
  dailyMinutes: number;
  activityAdjustment: ActivityAdjustment[];
}

const today = new Date();

export function TodayBadge({
  dailyMinutes,
  isLoading,
  activityAdjustment,
}: Props) {
  const { fetcher } = useHomeContext();
  const todayDate = format(fetcher?.date || today, "yyyy-MM-dd");
  
  const todayAdjustment = useMemo(
    () => activityAdjustment.filter((act) => act.date === todayDate),
    [activityAdjustment, todayDate],
  );

  const totalTodayWork = useMemo(
    () => todayAdjustment.reduce((acc, curr) => acc + curr.affected_minutes, 0),
    [todayAdjustment],
  );

  const totalMinutes = totalTodayWork + dailyMinutes;

  return (
    <TooltipProvider>
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          <Badge
            variant="secondary"
            className={cn(
              "flex items-center gap-2.5 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1.5 h-10.5 transition-all cursor-help",
              isLoading && "opacity-70",
            )}
          >
            <Clock className="w-4 h-4 text-indigo-400 shrink-0" />
            <div className="flex flex-col items-start min-w-15">
              <span className="text-[9px] leading-none uppercase text-indigo-400 font-bold mb-1">
                Hari Ini
              </span>
              {isLoading ? (
                <Skeleton className="h-3 w-10 bg-indigo-400/20" />
              ) : (
                <div className="text-xs font-bold text-white leading-none">
                  {formatToTime(totalMinutes, "minutes")}
                </div>
              )}
            </div>
          </Badge>
        </TooltipTrigger>
        
        <TooltipContent side="bottom" className="p-3 bg-slate-900 border-slate-800 text-white">
          <div className="space-y-1.5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Rincian Waktu</p>
            <div className="flex justify-between gap-4 text-xs">
              <span className="text-slate-300">Menit Dasar:</span>
              <span className="font-mono">{formatToTime(dailyMinutes, "minutes")}</span>
            </div>
            <div className="flex justify-between gap-4 text-xs">
              <span className="text-slate-300">Penyesuaian:</span>
              <span className={cn("font-mono", totalTodayWork >= 0 ? "text-emerald-400" : "text-rose-400")}>
                {totalTodayWork > 0 ? "+" : ""}{formatToTime(totalTodayWork, "minutes")}
              </span>
            </div>
            <hr className="border-slate-700" />
            <div className="flex justify-between gap-4 text-xs font-bold">
              <span>Total:</span>
              <span>{formatToTime(totalMinutes, "minutes")}</span>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}