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
import { Badge } from "@/components/ui/badge";
import { RotateCcw } from "lucide-react";
import { NativeTimerDevControls } from "./native-timer-dev-controls";

export function Controller() {
  const { fetcher, controllerTime } = useHomeContext();
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
        <NativeTimerDevControls />
      </div>

      <div className="flex justify-between">
        <div className="flex gap-4 items-center flex-wrap">
          <MutateButton mutate={fetcher.mutate} />
          {isAuto && <TimerStatusBadge />}
          {isAuto && controllerTime.didAutoResume && (
            <Badge className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-700">
              <RotateCcw className="h-3 w-3" />
              Session resumed automatically
            </Badge>
          )}
        </div>
        <TimelineTotalWork />
      </div>
    </div>
  );
}
