import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { MatrixResponse } from "@/features/matrix/types/matrix.types";
import { MatrixBox } from "./matrix-box";
import { getHours, format } from "date-fns";
import { cn } from "@/lib/utils";

interface Props {
  user: MatrixResponse;
}

export function MatrixDataUserActivity({ user }: Props) {
  return (
    <div className="flex gap-1 md:gap-1.5 w-full justify-between pb-2">
      {user.activity.map((intensity, idx) => {
        const minutes = intensity * 5;

        // Cari sesi yang dimulai pada jam ini
        const startSessions =
          user.workSession?.filter(
            (s) => getHours(new Date(s.start_at)) === idx,
          ) || [];

        // Cari sesi yang berakhir pada jam ini
        const endSessions =
          user.workSession?.filter(
            (s) => s.end_at && getHours(new Date(s.end_at)) === idx,
          ) || [];

        const isSessionStart = startSessions.length > 0;
        const isSessionEnd = endSessions.length > 0;

        const allEvents = [
          ...startSessions.map((s) => ({
            type: "start",
            time: new Date(s.start_at),
            id: s.id,
          })),
          ...endSessions.map((s) => ({
            type: "end",
            time: new Date(s.end_at!),
            id: s.id,
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
                {/* Header: User & Jam */}
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

                <div className="flex flex-col gap-1 mt-1 pt-1 border-t border-white/5">
                  {allEvents.map((event) => (
                    <div
                      key={`${event.type}-${event.id}`}
                      className={cn(
                        "flex items-center gap-1.5 font-medium",
                        event.type === "start"
                          ? "text-emerald-400"
                          : "text-rose-400",
                      )}
                    >
                      <div
                        className={cn(
                          "size-1 rounded-full",
                          event.type === "start"
                            ? "bg-emerald-500 animate-pulse"
                            : "bg-rose-500",
                        )}
                      />
                      <span>
                        {event.type === "start" ? "Mulai" : "Selesai"}:{" "}
                        {format(event.time, "HH:mm")}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </TooltipContent>
          </Tooltip>
        );
      })}
    </div>
  );
}
