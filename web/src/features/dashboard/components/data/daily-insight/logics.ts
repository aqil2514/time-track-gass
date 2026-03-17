import { webUrl } from "@/constants/server-url";
import { DailySummaryDb } from "@/features/dashboard/interface/daily-summary.interface";
import { useFetch } from "@/hooks/use-fetch";
import { useQueryParams } from "@/hooks/use-query-params";
import { buildUrl } from "@/utils/build-url";

export function useDailyInsight() {
  const { get } = useQueryParams();

  const date = get("date");
  const user = get("user");

  const isCanFetch = !!date && !!user;

  const url = isCanFetch
    ? buildUrl("api/user-daily-insight", webUrl, {
        date,
        user,
      })
    : null;

  const { data, isLoading } = useFetch<DailySummaryDb>(url, {
    keepPreviousData: false,
  });

  return {isLoading, data}
}
