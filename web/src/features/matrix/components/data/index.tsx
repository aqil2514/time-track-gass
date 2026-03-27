import { Card, CardContent } from "@/components/ui/card";
import { useMatrixContext } from "../../provider/matrix.provider";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import { useRouter } from "next/navigation";
import { useQueryParams } from "@/hooks/use-query-params";

const hours = Array.from({ length: 24 }, (_, i) =>
  i.toString().padStart(2, "0"),
);

const calculateTotalHours = (activity: number[]) =>
  activity.filter((val) => val > 0).length;

export function MatrixData() {
  const { data, isLoading } = useMatrixContext();
  const router = useRouter();

  const { get } = useQueryParams();
  const rawDate = get("date");

  if (isLoading) {
    return (
      <div className="p-6 text-slate-500 animate-pulse">
        Memuat data matriks...
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="p-6 text-slate-500">
        Tidak ada data aktivitas untuk tanggal ini.
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="p-6 bg-[#020817] text-slate-400 text-[11px] font-sans">
        <Card className="bg-[#020817]/50 border-slate-800/50 backdrop-blur-sm">
          <CardContent className="p-6">
            {/* Header */}
            <div className="flex items-center mb-6 border-b border-slate-800/50 pb-4">
              <div className="w-40 shrink-0 uppercase tracking-[0.2em] text-[10px] font-bold text-slate-500">
                Tim / Durasi Aktif
              </div>
              <div className="flex gap-1.5 w-full justify-between px-2">
                {hours.map((hour) => (
                  <div
                    key={hour}
                    className="w-full text-center text-[10px] text-slate-300 font-medium"
                  >
                    {hour}
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-5">
              {data.map((user) => {
                const totalActive = calculateTotalHours(user.activity);

                return (
                  <div key={user.userId} className="flex items-center group gap-4">
                    <div className="flex justify-between">
                      <div className="w-40 shrink-0 flex flex-col pr-4">
                        <span className="text-slate-300 font-semibold truncate uppercase tracking-wider text-[11px]">
                          {user.userName}
                        </span>
                        <span className="text-[10px] text-purple-400/80 font-mono mt-0.5">
                          ~{totalActive} JAM AKTIF
                        </span>
                      </div>

                      <Button
                        size={"icon-xs"}
                        variant={"outline"}
                        title="Lihat Aktivitas"
                        onClick={() =>
                          router.push(
                            `/activity?user=${user.userName}&date=${rawDate}`,
                          )
                        }
                      >
                        <Eye />
                      </Button>
                    </div>

                    <div className="flex gap-1.5 w-full justify-between">
                      {user.activity.map((intensity, idx) => {
                        const minutes = intensity * 5;

                        return (
                          <Tooltip key={idx}>
                            <TooltipTrigger asChild>
                              <div
                                className="w-full h-9 rounded-md transition-all duration-300 border border-white/2 cursor-help"
                                style={{
                                  backgroundColor:
                                    intensity === 0
                                      ? "#060b18"
                                      : `rgba(168, 85, 247, ${intensity / 12})`,
                                  boxShadow:
                                    intensity > 8
                                      ? `0 0 ${intensity * 1.2}px rgba(168, 85, 247, ${intensity / 20})`
                                      : "none",
                                }}
                              />
                            </TooltipTrigger>
                            <TooltipContent
                              side="top"
                              className="bg-slate-900 border-slate-800 text-slate-200 text-[10px] px-3 py-1.5 shadow-xl"
                            >
                              <div className="flex flex-col gap-0.5">
                                <span className="font-bold text-purple-400">
                                  {user.userName} | Pukul {idx}:00
                                </span>
                                <span>
                                  {intensity} Aktivitas (~{minutes} Menit)
                                </span>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Legenda */}
        <div className="mt-6 flex gap-6 items-center text-[10px] uppercase tracking-[0.15em] text-slate-500 font-bold">
          <span>Intensity:</span>
          <div className="flex gap-4 items-center">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-[#060b18] border border-slate-800 rounded-sm" />
              <span className="text-slate-600">Off</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-purple-400 shadow-[0_0_8px_rgba(168, 85, 247, 0.6)] rounded-sm" />
              <span className="text-slate-300">High Activity</span>
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
