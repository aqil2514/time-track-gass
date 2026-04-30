import { MatrixResponse } from "@/features/matrix/types/matrix.types";
import { useQueryParams } from "@/hooks/use-query-params";
import { formatToTime } from "@/utils/format-to-time";
import { format } from "date-fns-tz";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useMemo } from "react";

interface Props {
  user: MatrixResponse;
}

export function DayIndicator({ user }: Props) {
  const { get } = useQueryParams();
  const rawDate = get("date");

  const formattedDate = rawDate
    ? format(rawDate, "yyyy-MM-dd", { timeZone: "Asia/Jakarta" })
    : null;

  const selectedAdjustment = user.workAdjustment?.find(
    (adjustment) => adjustment.date === formattedDate,
  );

  const activityMinutes = useMemo(() => {
    if (!user.newActivity)
      return user.activity.reduce((acc, curr) => acc + curr * 5, 0);

    return user.newActivity.reduce((acc, curr) => acc + curr.totalMinutes, 0);
  }, [user]);

  const totalDailyMinutes = selectedAdjustment
    ? selectedAdjustment.affected_minutes + activityMinutes
    : activityMinutes;

  const totalActive = formatToTime(totalDailyMinutes, "minutes");

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex items-center gap-1.5 cursor-help group/day">
          <div
            className={`w-1.5 h-1.5 rounded-full transition-colors ${
              selectedAdjustment
                ? "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]"
                : "bg-purple-500 shadow-[0_0_5px_rgba(168,85,247,0.5)]"
            }`}
          />
          <span className="text-[10px] text-slate-400 font-mono">
            DAY:{" "}
            <span
              className={
                selectedAdjustment
                  ? "text-amber-400 font-bold"
                  : "text-purple-300"
              }
            >
              {totalActive}
            </span>
          </span>
        </div>
      </TooltipTrigger>

      <TooltipContent
        side="right"
        className="bg-slate-950 border-slate-800 p-2 text-[10px] shadow-2xl min-w-40"
      >
        <div className="space-y-2">
          <div className="flex flex-col border-b border-white/5 pb-1.5">
            <span className="font-bold text-slate-200">
              Detail Aktivitas Harian
            </span>
            <span className="text-slate-500">{formattedDate}</span>
          </div>

          <div className="space-y-1 font-mono">
            <div className="flex justify-between items-center text-slate-400">
              <span>Tracker Raw:</span>
              <span>{formatToTime(activityMinutes, "minutes")}</span>
            </div>

            {selectedAdjustment && (
              <>
                <div className="flex justify-between items-center text-amber-400">
                  <span>Adjustment:</span>
                  <span>
                    {formatToTime(
                      selectedAdjustment.affected_minutes,
                      "minutes",
                    )}
                  </span>
                </div>
                <div className="pt-1 mt-1 border-t border-white/5 text-[9px] text-slate-500 italic leading-relaxed">
                  <p className="text-amber-500/80 font-semibold not-italic">
                    Note: {selectedAdjustment.adjustment.name}
                  </p>
                  &quot;{selectedAdjustment.adjustment.notes}&quot;
                </div>
              </>
            )}
          </div>

          <div className="flex justify-between items-center pt-1 border-t border-white/10 font-bold text-purple-400">
            <span>TOTAL:</span>
            <span>{totalActive}</span>
          </div>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
