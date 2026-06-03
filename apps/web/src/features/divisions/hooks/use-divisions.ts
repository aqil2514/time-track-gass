import { useFetch } from "@/hooks/use-fetch";
import { buildUrl } from "@/utils/build-url";
import { useMemo } from "react";
import { KeyedMutator } from "swr";
import { DivisionsDb } from "../interfaces/divisions.interface";
import { webUrl } from "@/constants/server-url";

const GENERAL_DATA_ID = 8;

export interface UseDivisionsResult {
  data: DivisionsDb[];
  error: Error;
  isLoading: boolean;
  mutate: KeyedMutator<DivisionsDb[]>;
}

export function useDivisions(): UseDivisionsResult {
  const url = buildUrl("api/divisions", webUrl);

  const { data: raws, error, isLoading, mutate } = useFetch<DivisionsDb[]>(url);

  const data = useMemo<DivisionsDb[]>(() => {
    if (!raws) return [];

    const generalData = raws.find((r) => r.id === GENERAL_DATA_ID);
    const others = raws.filter((r) => r.id !== GENERAL_DATA_ID);

    return generalData ? [generalData, ...others] : raws;
  }, [raws]);

  return { data, error, isLoading, mutate };
}
