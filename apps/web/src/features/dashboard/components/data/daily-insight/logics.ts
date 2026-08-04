import { webUrl } from "@/constants/server-url";
import { DailySummaryPerCategory } from "@/features/dashboard/interface/daily-summary-percategory.interface";
import { DailySummaryDb } from "@/features/dashboard/interface/daily-summary.interface";
import { useFetch } from "@/hooks/use-fetch";
import { useQueryParams } from "@/hooks/use-query-params";
import { buildUrl } from "@/utils/build-url";

function useDateParams() {
  const { get } = useQueryParams();
  const date = get("date");
  const from = get("from");
  const to = get("to");
  const user = get("user");
  const hasDate = !!date || (!!from && !!to);
  const dateParams = date ? { date } : { from, to };
  return { user, hasDate, dateParams };
}

export function useSummaryMode() {
  const { user, hasDate, dateParams } = useDateParams();

  const isCanFetch = hasDate && !!user;

  const url = isCanFetch
    ? buildUrl("api/user-daily-insight", webUrl, { ...dateParams, user })
    : null;

  const { data, isLoading } = useFetch<DailySummaryDb>(url, {
    keepPreviousData: false,
  });

  return {isLoading, data}
}

export function useDetailMode() {
  const { user, hasDate, dateParams } = useDateParams();

  const isCanFetch = hasDate && !!user;

  const url = isCanFetch
    ? buildUrl("api/user-daily-percategory", webUrl, { ...dateParams, user })
    : null;

  const { data, isLoading } = useFetch<DailySummaryPerCategory[]>(url, {
    keepPreviousData: false,
  });

  return {isLoading, data}
}

