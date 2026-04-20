import { RefreshCw } from "lucide-react";
import { MutateButton } from "@/components/atoms/mutate-button";
import { WeeklyBadge } from "./weekly-badge";
import { TodayBadge } from "./today-badge";
import { useTotalWork } from "./logic";

const ErrorComp = () => {
  return (
    <div className="flex justify-end py-4">
      <span className="text-[10px] text-destructive font-medium bg-destructive/10 px-2 py-1 rounded">
        Gagal memuat ringkasan waktu
      </span>
    </div>
  );
};

export function TimelineTotalWork() {
  const {
    dailyMinutes,
    error,
    isLoading,
    isValidating,
    mutate,
    weeklyMinutes,
    activityAdjustment
  } = useTotalWork();

  if (error) return <ErrorComp />;

  return (
    <div className="flex items-center gap-3 justify-end py-4 relative">
      {isValidating && (
        <RefreshCw className="w-3 h-3 animate-spin text-indigo-500 absolute -top-1 right-0" />
      )}

      <WeeklyBadge isLoading={isLoading} weeklyMinutes={weeklyMinutes} activityAdjustment={activityAdjustment} />

      <TodayBadge isLoading={isLoading} dailyMinutes={dailyMinutes} activityAdjustment={activityAdjustment} />

      <MutateButton mutate={mutate} />
    </div>
  );
}
