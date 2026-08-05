import { webUrl } from "@/constants/server-url";
import { AIScreenReportDb } from "@/features/dashboard/interface/ai-screen-db.interface";
import { useFetch } from "@/hooks/use-fetch";
import { useQueryParams } from "@/hooks/use-query-params";
import { buildUrl } from "@/utils/build-url";
import { useMemo } from "react";
import { KeyedMutator } from "swr";
import { PaginatedResponse } from "@/@types/general";

export interface UseUserActivityTrackerResult {
  data: PaginatedResponse<AIScreenReportDb>;
  error: Error;
  isLoading: boolean;
  mutate: KeyedMutator<PaginatedResponse<AIScreenReportDb>>;
}

const EMPTY: PaginatedResponse<AIScreenReportDb> = {
  data: [],
  total: 0,
  page: 1,
  limit: 50,
  totalPages: 0,
};

export function useUserActivityTracker(): UseUserActivityTrackerResult {
  const { get } = useQueryParams();

  const user = get("user");
  const date = get("date");
  const from = get("from");
  const to = get("to");
  const page = get("page") ?? "1";
  const limit = get("limit") ?? "50";

  const hasDate = !!date || (!!from && !!to);
  const isCanFetch = !!user && hasDate;

  const url = isCanFetch
    ? buildUrl("api/user-activity-tracker", webUrl, { date, user, page, limit, from, to })
    : null;

  const { data: raw, error, isLoading, mutate } = useFetch<PaginatedResponse<AIScreenReportDb>>(url);

  const data = useMemo(() => (raw ?? EMPTY), [raw]);

  return { data, error, isLoading, mutate };
}
