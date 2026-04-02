import { Button } from "@/components/ui/button";
import { MatrixResponse } from "@/features/matrix/types/matrix.types";
import { useQueryParams } from "@/hooks/use-query-params";
import { Eye } from "lucide-react";
import { useRouter } from "next/navigation";
import { MatrixDataUserActivity } from "./acivity";

interface Props {
  data: MatrixResponse[];
  calculateTotalHours: (activity: number[], intensity?: number) => string
}

export function MatrixUserData({ data, calculateTotalHours }: Props) {
  const router = useRouter();
  const { get } = useQueryParams();
  const rawDate = get("date");
  return (
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
                <span className="text-[10px] text-purple-400/80 font-mono mt-0.5 uppercase">
                  ~{totalActive} Aktif
                </span>
              </div>

              <Button
                size={"icon-xs"}
                variant={"outline"}
                title="Lihat Aktivitas"
                onClick={() =>
                  router.push(`/activity?user=${user.userName}&date=${rawDate}`)
                }
              >
                <Eye />
              </Button>
            </div>

            <MatrixDataUserActivity user={user} />
          </div>
        );
      })}
    </div>
  );
}
