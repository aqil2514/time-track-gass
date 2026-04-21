import { ExportToExcelButton } from "./export-to-excel";
import { StartSessionButton } from "./start-session";
import { DatePicker } from "@/components/molecules/date-picker";
import { TimerStatusBadge } from "./timer-status-badge";
import { MutateButton } from "@/components/atoms/mutate-button";
import { useHomeContext } from "../../store/home.provider";
import { TimelineTotalWork } from "./total-work";
import { useUserSetting } from "@/hooks/use-user-settings";
import { useMemo } from "react";
import { UploadImage } from "./upload-image";

export function Controller() {
  const { fetcher } = useHomeContext();
  const { data, isLoading: isSettingLoading } = useUserSetting();

  const isAuto = useMemo(() => {
    if (!data) false;

    return data?.tracker.mode === "auto";
  }, [data]);

  return (
    <div className="space-y-4">
      <div className="flex gap-4 items-center">
        <DatePicker date={fetcher.date} setDate={fetcher.setDate} />
        {isSettingLoading ? (
             <div className="h-9 w-32 animate-pulse bg-slate-800 rounded-md" />
          ) : (
            <div className="transition-all duration-300 ease-in-out transform">
              {isAuto ? <StartSessionButton /> : <UploadImage />}
            </div>
          )}
        <ExportToExcelButton />
      </div>

      <div className="flex justify-between">
        <div className="flex gap-4 items-center">
          <MutateButton mutate={fetcher.mutate} />
          {isAuto && <TimerStatusBadge />}
        </div>
        <TimelineTotalWork />
      </div>
    </div>
  );
}
