import { useMemo } from "react";
import { UserAttendanceDetail } from "@/features/attendance/interfaces/attendace-logs.interface";
import { useSummaryAttendance } from "@/features/attendance/provider/summary.provider";
import { useFetch } from "@/hooks/use-fetch";
import { useQueryParams } from "@/hooks/use-query-params";
import { buildUrl } from "@/utils/build-url";
import { webUrl } from "@/constants/server-url";
import { ControlledDialogContainer } from "@/components/containers/controlled-dialog-container";
import { DetailDialogLoading } from "../sub/detail/loading";
import { DetailDialogData } from "../sub/detail/data";
import { ScrollArea } from "@/components/ui/scroll-area";

export function DetailDialog() {
  const { get, update } = useQueryParams();
  const { query } = useSummaryAttendance();
  const open = get("action") === "detail";
  const userId = get("userId");

  const url = useMemo<string | null>(() => {
    if (!userId) return null;
    return buildUrl(`/api/attendance/summary/${userId}`, webUrl, query);
  }, [query, userId]);

  const { data, isLoading } = useFetch<UserAttendanceDetail>(url);

  return (
    <ControlledDialogContainer
      title="Detail Ringkasan"
      description="Informasi detail kehadiran dan penyesuaian waktu"
      open={open}
      onOpenChange={(o) => !o && update({ userId: null, action: null })}
      className="sm:max-w-7xl bg-[#0f1021] text-slate-200 border-slate-800"
    >
      <ScrollArea className="h-96 px-4">
        {isLoading ? <DetailDialogLoading /> : <DetailDialogData data={data} />}
      </ScrollArea>
    </ControlledDialogContainer>
  );
}
