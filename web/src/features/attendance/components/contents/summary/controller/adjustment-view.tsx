import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useSummaryAttendance } from "@/features/attendance/provider/summary.provider";
import { useQueryParams } from "@/hooks/use-query-params";
import { MonitorCog } from "lucide-react";
import { useMemo } from "react";

export function AdjustmentViewButton() {
  const { query } = useSummaryAttendance();
  const { set } = useQueryParams();

  const isHavePeriod = useMemo<boolean>(() => {
    if (query.mode === "weekly") {
      if (!query.date) return false;
      return true;
    } else {
      if (!query.month || !query.year) return false;
      return true;
    }
  }, [query]);

  const havePeriodContent =
    query.mode === "weekly"
      ? "Lihat penyesuaian yang aktif pada minggu ini"
      : "Lihat penyesuaian yang aktif pada bulan ini";

  const noPeriodContent =
    query.mode === "weekly"
      ? "Silahkan pilih tanggal terlebih dahulu"
      : "Silahkan pilih bulan dan tahun terlebih dahulu";
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex">
          <Button
            onClick={() => set("action", "adjustment-content")}
            variant={"accent"}
            size={"icon-sm"}
            disabled={!isHavePeriod}
            className={!isHavePeriod ? "pointer-events-none" : ""}
          >
            <MonitorCog />
          </Button>
        </span>
      </TooltipTrigger>
      <TooltipContent>
        {isHavePeriod ? (
          <p>{havePeriodContent}</p>
        ) : (
          <p>{noPeriodContent}</p>
        )}
      </TooltipContent>
    </Tooltip>
  );
}
