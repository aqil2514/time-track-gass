import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { MatrixResponse } from "@/features/matrix/types/matrix.types";
import { MatrixBox } from "./matrix-box";
import { getHours, isSameDay, differenceInMinutes } from "date-fns";
import { toZonedTime, format } from "date-fns-tz";
import { cn } from "@/lib/utils";

const TIMEZONE = "Asia/Jakarta";

interface Props {
  user: MatrixResponse;
  selectedDate: string;
}

function getDayLabel(eventDate: Date, referenceDate: Date): string | null {
  const eventDay = toZonedTime(eventDate, TIMEZONE);
  const refDay = toZonedTime(referenceDate, TIMEZONE);

  const diffDays = Math.round(
    (new Date(
      format(eventDay, "yyyy-MM-dd", { timeZone: TIMEZONE }),
    ).getTime() -
      new Date(
        format(refDay, "yyyy-MM-dd", { timeZone: TIMEZONE }),
      ).getTime()) /
      (1000 * 60 * 60 * 24),
  );

  if (diffDays === 1) return "besok";
  if (diffDays === -1) return "kemarin";
  return null;
}

export function MatrixDataUserActivity({ user, selectedDate }: Props) {
  const selectedDateWib = toZonedTime(new Date(selectedDate), TIMEZONE);

  return (
    <div className="flex gap-1 md:gap-1.5 w-full justify-between pb-2">
      {user.activity.map((intensity, idx) => {
        const minutes = intensity * 5;

        const startSessions =
          user.workSession?.filter((s) => {
            const zonedStart = toZonedTime(new Date(s.start_at), TIMEZONE);
            return (
              getHours(zonedStart) === idx &&
              isSameDay(zonedStart, selectedDateWib)
            );
          }) || [];

        const endSessions =
          user.workSession?.filter((s) => {
            if (!s.end_at) return false;
            const zonedEnd = toZonedTime(new Date(s.end_at), TIMEZONE);
            return (
              getHours(zonedEnd) === idx && isSameDay(zonedEnd, selectedDateWib)
            );
          }) || [];

        const isSessionStart = startSessions.length > 0;
        const isSessionEnd = endSessions.length > 0;

        const allEvents = [
          ...startSessions.map((s) => ({
            type: "start" as const,
            time: toZonedTime(new Date(s.start_at), TIMEZONE),
            endTime: s.end_at
              ? toZonedTime(new Date(s.end_at), TIMEZONE)
              : null,
            id: s.id,
            stopMode: s.stop_mode,
          })),
          ...endSessions.map((s) => ({
            type: "end" as const,
            time: toZonedTime(new Date(s.end_at!), TIMEZONE),
            endTime: null,
            id: s.id,
            stopMode: s.stop_mode,
          })),
        ].sort((a, b) => a.time.getTime() - b.time.getTime());

        return (
          <Tooltip key={idx}>
            <TooltipTrigger asChild>
              <div className="flex-1 min-w-3 md:min-w-5">
                <MatrixBox
                  config={{
                    intensity,
                    isWorkSessionStart: isSessionStart,
                    isWorkSessionEnd: isSessionEnd,
                  }}
                />
              </div>
            </TooltipTrigger>
            <TooltipContent
              side="top"
              className="bg-slate-950 border-slate-800 text-slate-200 text-[10px] px-3 py-2 shadow-2xl min-w-35"
            >
              <div className="flex flex-col gap-1.5">
                {/* Header */}
                <div className="flex flex-col border-b border-white/5 pb-1">
                  <span className="font-black text-purple-400 uppercase tracking-tight">
                    {user.userName}
                  </span>
                  <span className="text-slate-500 font-medium">
                    Rentang Pukul {idx}:00 - {idx}:59
                  </span>
                </div>

                {/* Info Aktivitas */}
                <div className="flex items-center gap-2">
                  <div className="size-1.5 rounded-full bg-purple-500" />
                  <span>
                    {intensity} Laporan (~{minutes} Menit)
                  </span>
                </div>

                {/* Work Session Events */}
                {allEvents.length > 0 && (
                  <div className="flex flex-col gap-1.5 mt-1 pt-1 border-t border-white/5">
                    {allEvents.map((event) => {
                      const dayLabel = getDayLabel(
                        event.time,
                        new Date(selectedDate),
                      );

                      // Hitung durasi jika ini start event dan ada end_at
                      const duration =
                        event.type === "start" && event.endTime
                          ? differenceInMinutes(event.endTime, event.time)
                          : null;

                      const durationHours =
                        duration !== null ? Math.floor(duration / 60) : null;
                      const durationMins =
                        duration !== null ? duration % 60 : null;

                      // Cek apakah end_at cross-midnight
                      const endDayLabel =
                        event.type === "start" && event.endTime
                          ? getDayLabel(event.endTime, new Date(selectedDate))
                          : null;

                      return (
                        <div
                          key={`${event.type}-${event.id}`}
                          className={cn(
                            "flex flex-col gap-0.5",
                            event.type === "start"
                              ? "text-emerald-400"
                              : "text-rose-400",
                          )}
                        >
                          {/* Jam mulai */}
                          <div className="flex items-center gap-1.5 font-medium">
                            <div
                              className={cn(
                                "size-1 rounded-full shrink-0",
                                event.type === "start"
                                  ? "bg-emerald-500 animate-pulse"
                                  : "bg-rose-500",
                              )}
                            />
                            <span>
                              {event.type === "start" ? "Mulai" : "Selesai"}:{" "}
                              {format(event.time, "HH:mm")}{" "}
                              {event.type === "end" && event.stopMode && `(${event.stopMode.toLocaleUpperCase()})`}
                              {dayLabel && (
                                <span className="ml-1 text-slate-500 font-normal">
                                  ({dayLabel})
                                </span>
                              )}
                            </span>
                          </div>

                          {/* Jam selesai (hanya di start event) */}
                          {event.type === "start" && event.endTime && (
                            <div className="flex items-center gap-1.5 font-medium text-rose-400 ml-2.5">
                              <div className="size-1 rounded-full bg-rose-500 shrink-0" />
                              <span>
                                Selesai: {format(event.endTime, "HH:mm")}
                                {endDayLabel && (
                                  <span className="ml-1 text-slate-500 font-normal">
                                    ({endDayLabel})
                                  </span>
                                )}
                              </span>
                            </div>
                          )}

                          {/* Durasi */}
                          {duration !== null && (
                            <div className="flex items-center gap-1.5 ml-2.5 text-slate-400">
                              <div className="size-1 rounded-full bg-slate-600 shrink-0" />
                              <span>
                                Durasi:{" "}
                                {durationHours! > 0
                                  ? `${durationHours} jam ${durationMins} menit`
                                  : `${durationMins} menit`}
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </TooltipContent>
          </Tooltip>
        );
      })}
    </div>
  );
}
