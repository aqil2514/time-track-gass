import { webUrl } from "@/constants/server-url";
import { DailySummaryPerCategory } from "@/features/dashboard/interface/daily-summary-percategory.interface";
import { DailySummaryDb } from "@/features/dashboard/interface/daily-summary.interface";
import { useFetch } from "@/hooks/use-fetch";
import { useQueryParams } from "@/hooks/use-query-params";
import { buildUrl } from "@/utils/build-url";

export function useSummaryMode() {
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

export function useDetailMode() {
  const { get } = useQueryParams();

  const date = get("date");
  const user = get("user");

  const isCanFetch = !!date && !!user;

  const url = isCanFetch
    ? buildUrl("api/user-daily-percategory", webUrl, {
        date,
        user,
      })
    : null;

  const { data, isLoading } = useFetch<DailySummaryPerCategory[]>(url, {
    keepPreviousData: false,
  });

  return {isLoading, data}
}

