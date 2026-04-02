import { webUrl } from "@/constants/server-url";
import { useFetch } from "@/hooks/use-fetch";
import { useQueryParams } from "@/hooks/use-query-params";
import { buildUrl } from "@/utils/build-url";
import { useMemo } from "react";
import { KeyedMutator } from "swr";
import { DivisionsDb } from "../interfaces/divisions.interface";

export interface UseDivisionsResult {
  data: DivisionsDb[];
  error: Error;
  isLoading: boolean;
  mutate: KeyedMutator<DivisionsDb[]>;
}

export function useDivisions(): UseDivisionsResult {
  const { get } = useQueryParams();

  const user = get("user");
  const date = get("date");

  const isCanFetch = !!date && !!user;

  const url = isCanFetch
    ? buildUrl("api/divisions", webUrl, {
        date,
        user,
      })
    : null;

  const {
    data: raws,
    error,
    isLoading,
    mutate,
  } = useFetch<DivisionsDb[]>(url);

  const data = useMemo(() => (raws ? raws : []), [raws]);

  return { data, error, isLoading, mutate };
}
