"use client";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { MultiDayMatrixEntry, MultiDayMatrixResponse } from "@/features/matrix/types/matrix.types";
import { format, parseISO } from "date-fns";
import { id } from "date-fns/locale";
import { useRouter } from "next/navigation";
import { formatToTime } from "@/utils/format-to-time";

interface Props {
  user: MultiDayMatrixResponse;
  entry: MultiDayMatrixEntry;
  maxActivity: number;
}

function getIntensity(totalActivity: number, maxActivity: number): number {
  if (maxActivity === 0 || totalActivity === 0) return 0;
  return Math.ceil((totalActivity / maxActivity) * 12);
}

export function MultiDayBox({ user, entry, maxActivity }: Props) {
  const router = useRouter();
  const intensity = getIntensity(entry.totalActivity, maxActivity);
  const dateLabel = format(parseISO(entry.date), "d MMM yyyy", { locale: id });

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className="w-full h-9 rounded-md border border-white/5 cursor-pointer transition-all duration-200 hover:border-purple-500/50 hover:scale-105 relative overflow-hidden"
          style={{
            backgroundColor:
              intensity === 0
                ? "#060b18"
                : `rgba(168, 85, 247, ${intensity / 12})`,
            boxShadow:
              intensity > 8
                ? `inset 0 0 10px rgba(168, 85, 247, ${intensity / 30}), 0 0 ${intensity * 1.2}px rgba(168, 85, 247, ${intensity / 25})`
                : "none",
          }}
        >
          {intensity > 0 && (
            <div className="absolute inset-0 bg-linear-to-br from-white/10 to-transparent pointer-events-none" />
          )}
        </div>
      </TooltipTrigger>
      <TooltipContent
        side="top"
        className="bg-slate-950 border-slate-800 text-slate-200 text-[10px] px-3 py-2 shadow-2xl min-w-40"
      >
        <div className="flex flex-col gap-2">
          <div className="border-b border-white/5 pb-1.5">
            <span className="font-black text-purple-400 uppercase tracking-tight">
              {user.userName}
            </span>
            <p className="text-slate-400 font-medium">{dateLabel}</p>
          </div>

          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 pb-1 border-b border-white/5">
              <div className="size-1.5 rounded-full bg-slate-400 shrink-0" />
              <span className="text-slate-300 font-semibold">
                {entry.totalActivity + entry.unclassified.count + entry.idle.count} total laporan
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="size-1.5 rounded-full bg-purple-500 shrink-0" />
              <span className="text-slate-200">
                <span className="text-purple-400 font-semibold">{entry.totalActivity}</span> valid ({formatToTime(entry.totalMinutes, "minutes")})
              </span>
            </div>
            {entry.unclassified.count > 0 && (
              <div className="flex items-center gap-2">
                <div className="size-1.5 rounded-full bg-amber-500 shrink-0" />
                <span className="text-slate-400">
                  <span className="text-amber-400 font-semibold">{entry.unclassified.count}</span> unclassified ({formatToTime(entry.unclassified.minutes, "minutes")})
                </span>
              </div>
            )}
            {entry.idle.count > 0 && (
              <div className="flex items-center gap-2">
                <div className="size-1.5 rounded-full bg-slate-500 shrink-0" />
                <span className="text-slate-400">
                  <span className="text-slate-300 font-semibold">{entry.idle.count}</span> idle ({formatToTime(entry.idle.minutes, "minutes")})
                </span>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-1 pt-1 border-t border-white/5">
            <button
              onClick={() => router.push(`/activity?user=${user.userName}&date=${entry.date}`)}
              className="text-left text-purple-400 hover:text-purple-300 transition-colors font-medium"
            >
              → Lihat Aktivitas
            </button>
            <button
              onClick={() => router.push(`/matrix?date=${entry.date}`)}
              className="text-left text-slate-400 hover:text-slate-300 transition-colors font-medium"
            >
              → Lihat Matrix
            </button>
          </div>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
