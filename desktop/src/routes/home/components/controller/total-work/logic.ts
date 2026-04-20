import { useFetch } from "@/hooks/use-fetch";
import { useHomeContext } from "@/routes/home/store/home.provider";
import { UserSummaryTimeResponse } from "@/routes/home/types/activites-data.type";
import { buildUrl } from "@/utils/build-url";
import { format } from "date-fns";
import { useMemo } from "react";

export function useTotalWork() {
  const { fetcher } = useHomeContext();

  const url = useMemo<string | null>(
    () =>
      fetcher.date
        ? buildUrl(
            `activities/total-work?date=${format(fetcher.date, "yyyy-MM-dd")}`,
          )
        : null,
    [fetcher.date],
  );

  const { data, error, isLoading, mutate, isValidating } =
    useFetch<UserSummaryTimeResponse>(url);

  const dailyMinutes = data?.dailySummaryTime?.total_work_time_minutes || 0;
  const weeklyMinutes = data?.weeklySummaryTime?.total_work_time_minutes || 0;
  const activityAdjustment = data?.activityAdjustment ?? [];

  return {
    dailyMinutes,
    weeklyMinutes,
    activityAdjustment,
    
    error,
    isLoading,
    mutate,
    isValidating,
  };
}
