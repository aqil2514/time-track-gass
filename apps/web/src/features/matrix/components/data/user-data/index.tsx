import { Button } from "@/components/ui/button";
import { MatrixResponse } from "@/features/matrix/types/matrix.types";
import { useQueryParams } from "@/hooks/use-query-params";
import { Eye } from "lucide-react";
import { useRouter } from "next/navigation";
import { MatrixDataUserActivity } from "./activity";
import { DayIndicator } from "./indicator-day";
import { WeekIndicator } from "./indicator-week";

interface Props {
  data: MatrixResponse[];
}

export function MatrixUserData({ data }: Props) {
  const router = useRouter();
  const { get } = useQueryParams();
  const rawDate = get("date");

  return (
    <div className="space-y-8 md:space-y-6">
      {data.map((user) => {
        return (
          // Ubah ke flex-col di mobile, flex-row di desktop
          <div
            key={user.userId}
            className="flex flex-col md:flex-row items-start group gap-4 md:gap-6"
          >
            {/* Bagian Kiri: Nama & Indikator */}
            {/* Mobile: w-full, No border-r. Desktop: w-44, border-r */}
            <div className="w-full md:w-44 shrink-0 flex justify-between items-start border-b md:border-b-0 md:border-r border-slate-800/60 pb-3 md:pb-0 md:pr-4">
              <div className="flex flex-col gap-1">
                <span className="text-slate-200 font-bold truncate uppercase tracking-widest text-[11px] group-hover:text-purple-400 transition-colors">
                  {user.userName}
                </span>

                <div className="flex flex-row md:flex-col gap-3 md:gap-0.5">
                  <DayIndicator user={user} />
                  <WeekIndicator user={user} />
                </div>
              </div>

              <Button
                size={"icon-xs"}
                variant={"outline"}
                className="opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-slate-900 border-slate-700 text-purple-400"
                onClick={() =>
                  router.push(`/activity?user=${user.userName}&date=${rawDate}`)
                }
              >
                <Eye className="w-3.5 h-3.5" />
              </Button>
            </div>

            {/* Bagian Kanan: Matrix jam */}
            {/* Tambahkan overflow-x-auto agar bisa di-scroll jika matrix terlalu lebar */}
            <div className="w-full pt-1 overflow-x-auto no-scrollbar">
              <div className="min-w-150 md:min-w-0">
                <MatrixDataUserActivity
                  user={user}
                  selectedDate={String(rawDate)}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
