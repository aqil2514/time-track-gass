import { Button } from "@/components/ui/button";
import { MatrixResponse } from "@/features/matrix/types/matrix.types";
import { useQueryParams } from "@/hooks/use-query-params";
import { Eye, Clock } from "lucide-react";
import { useRouter } from "next/navigation";
import { MatrixDataUserActivity } from "./activity";

interface Props {
  data: MatrixResponse[];
  calculateTotalHours: (activity: number[], intensity?: number) => string
}

export function MatrixUserData({ data, calculateTotalHours }: Props) {
  const router = useRouter();
  const { get } = useQueryParams();
  const rawDate = get("date");

  return (
    <div className="space-y-6">
      {data.map((user) => {
        const totalActive = calculateTotalHours(user.activity);
        const totalWeekly = calculateTotalHours([user.totalWeeklyActivity], 1)
        
        return (
          <div key={user.userId} className="flex items-start group gap-6">
            <div className="w-44 shrink-0 flex justify-between items-start border-r border-slate-800/60 pr-4">
              <div className="flex flex-col gap-1">
                <span className="text-slate-200 font-bold truncate uppercase tracking-widest text-[11px] group-hover:text-purple-400 transition-colors">
                  {user.userName}
                </span>
                
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-500 shadow-[0_0_5px_rgba(168,85,247,0.5)]" />
                    <span className="text-[10px] text-slate-400 font-mono">
                      DAY: <span className="text-purple-300">{totalActive}</span>
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3 h-3 text-amber-500/70" />
                    <span className="text-[10px] text-slate-400 font-mono">
                      WEEK: <span className="text-amber-500/90">~{totalWeekly}</span>
                    </span>
                  </div>
                </div>
              </div>

              <Button
                size={"icon-xs"}
                variant={"outline"}
                className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-slate-900 border-slate-700 hover:bg-purple-500/20 text-purple-400 hover:text-purple-500"
                title="Lihat Aktivitas"
                onClick={() =>
                  router.push(`/activity?user=${user.userName}&date=${rawDate}`)
                }
              >
                <Eye className="w-3.5 h-3.5" />
              </Button>
            </div>

            {/* MATRIKS AKTIVITAS */}
            <div className="flex-1 pt-1 overflow-x-auto">
              <MatrixDataUserActivity user={user} />
            </div>
          </div>
        );
      })}
    </div>
  );
}