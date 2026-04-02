import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { MatrixResponse } from "@/features/matrix/types/matrix.types";

interface Props {
  user: MatrixResponse;
}

export function MatrixDataUserActivity({ user }: Props) {
  return (
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
  );
}
