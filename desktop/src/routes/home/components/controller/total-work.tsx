import { Badge } from "@/components/ui/badge";
import { useHomeContext } from "@/routes/home/store/home.provider";
import { formatToTime } from "@/utils/format-to-time";
import { CalendarDays, Clock } from "lucide-react";

export function TimelineTotalWork() {
  const { fetcher } = useHomeContext();
  const { data } = fetcher;

  const dailyMinutes = data?.dailySummaryTime?.total_work_time_minutes || 0;
  const weeklyMinutes = data?.weeklySummaryTime?.total_work_time_minutes || 0;

  const formatCompact = (val: number) => {
    return formatToTime(val, "minutes")
      .replace(/ jam/g, "j")
      .replace(/ menit/g, "m")
      .replace(/ detik/g, "d");
  };

  return (
    <div className="flex items-center gap-3 justify-end py-4">
      <Badge
        variant="outline"
        className="flex items-center gap-2.5 border-slate-700 bg-slate-900/50 px-3 py-1.5 h-auto transition-all hover:bg-slate-900"
      >
        <CalendarDays className="w-4 h-4 text-slate-400 shrink-0" />
        <div className="flex flex-col items-start gap-0">
          <span className="text-[9px] leading-none uppercase text-slate-500 font-bold mb-0.5">
            Mingguan
          </span>
          <div className="text-xs font-semibold text-slate-200 leading-none">
            {formatCompact(weeklyMinutes)}
          </div>
        </div>
      </Badge>

      <Badge
        variant="secondary"
        className="flex items-center gap-2.5 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1.5 h-auto transition-all hover:bg-indigo-500/20"
      >
        <Clock className="w-4 h-4 text-indigo-400 shrink-0" />
        <div className="flex flex-col items-start gap-0">
          <span className="text-[9px] leading-none uppercase text-indigo-400 font-bold mb-0.5">
            Hari Ini
          </span>
          <div className="text-xs font-bold text-white leading-none">
            {formatCompact(dailyMinutes)}
          </div>
        </div>
      </Badge>
    </div>
  );
}
