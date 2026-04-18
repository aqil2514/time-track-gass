import { Badge } from "@/components/ui/badge";
import { useFetch } from "@/hooks/use-fetch";
import { formatToTime } from "@/utils/format-to-time";
import { CalendarDays, Clock, RefreshCw } from "lucide-react";
import { useHomeContext } from "../../store/home.provider";
import { buildUrl } from "@/utils/build-url";
import { format } from "date-fns";
import { useMemo } from "react";
import { UserSummaryTimeResponse } from "../../types/activites-data.type";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { MutateButton } from "@/components/atoms/mutate-button";

export function TimelineTotalWork() {
  const { fetcher } = useHomeContext();

  const url = useMemo<string | null>(
    () =>
      fetcher.date
        ? buildUrl(
            // `activities/total-work?date=${startOfDay(fetcher.date).toISOString()}`,
            `activities/total-work?date=${format(fetcher.date, "yyyy-MM-dd")}`,
          )
        : null,
    [fetcher.date],
  );

  const { data, error, isLoading, mutate, isValidating } =
    useFetch<UserSummaryTimeResponse>(url);

  const dailyMinutes = data?.dailySummaryTime?.total_work_time_minutes || 0;
  const weeklyMinutes = data?.weeklySummaryTime?.total_work_time_minutes || 0;

  const formatCompact = (val: number) => {
    return formatToTime(val, "minutes")
      .replace(/ jam/g, "j")
      .replace(/ menit/g, "m")
      .replace(/ detik/g, "d");
  };

  if (error) {
    return (
      <div className="flex justify-end py-4">
        <span className="text-[10px] text-destructive font-medium bg-destructive/10 px-2 py-1 rounded">
          Gagal memuat ringkasan waktu
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 justify-end py-4 relative">
      {isValidating && (
        <RefreshCw className="w-3 h-3 animate-spin text-indigo-500 absolute -top-1 right-0" />
      )}

      {/* Badge Mingguan */}
      <Badge
        variant="outline"
        className="flex items-center gap-2.5 border-slate-700 bg-slate-900/50 px-3 py-1.5 h-10.5 transition-all"
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
              {formatCompact(weeklyMinutes)}
            </div>
          )}
        </div>
      </Badge>

      {/* Badge Hari Ini */}
      <Badge
        variant="secondary"
        className={cn(
          "flex items-center gap-2.5 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1.5 h-10.5 transition-all",
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
              {formatCompact(dailyMinutes)}
            </div>
          )}
        </div>
      </Badge>

      <MutateButton mutate={mutate} />
    </div>
  );
}
