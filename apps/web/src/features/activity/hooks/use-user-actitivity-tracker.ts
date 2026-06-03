import { webUrl } from "@/constants/server-url";
import { AIScreenReportDb } from "@/features/dashboard/interface/ai-screen-db.interface";
import { useFetch } from "@/hooks/use-fetch";
import { useQueryParams } from "@/hooks/use-query-params";
import { buildUrl } from "@/utils/build-url";
import { useMemo } from "react";
import { KeyedMutator } from "swr";

export interface UseUserActivityTrackerResult {
  data: AIScreenReportDb[];
  error: Error;
  isLoading: boolean;
  mutate: KeyedMutator<AIScreenReportDb[]>;
}

export function useUserActivityTracker(): UseUserActivityTrackerResult {
  const { get } = useQueryParams();

  const user = get("user");
  const date = get("date");

  const isCanFetch = !!date && !!user;

  const url = isCanFetch
    ? buildUrl("api/user-activity-tracker", webUrl, {
        date,
        user,
      })
    : null;

  const {
    data: raws,
    error,
    isLoading,
    mutate,
  } = useFetch<AIScreenReportDb[]>(url);

  const data = useMemo(() => (raws ? raws : []), [raws]);

  return { data, error, isLoading, mutate };
}
