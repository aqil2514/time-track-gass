import { WeeklyBadge } from "./weekly-badge";
import { TodayBadge } from "./today-badge";
import { useHomeContext } from "@/routes/home/store/home.provider";

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
    fetcher: { data, isLoading, error },
  } = useHomeContext();

  const dailyMinutes =
    data?.totalWork?.dailySummaryTime?.total_work_time_minutes || 0;
  const weeklyMinutes =
    data?.totalWork?.weeklySummaryTime?.total_work_time_minutes || 0;
  const activityAdjustment = data?.totalWork?.activityAdjustment ?? [];

  if (error) return <ErrorComp />;

  return (
    <div className="flex items-center gap-3 justify-end py-4 relative">
      <WeeklyBadge
        isLoading={isLoading}
        weeklyMinutes={weeklyMinutes}
        activityAdjustment={activityAdjustment}
      />

      <TodayBadge
        isLoading={isLoading}
        dailyMinutes={dailyMinutes}
        activityAdjustment={activityAdjustment}
      />
    </div>
  );
}
