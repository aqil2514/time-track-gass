"use client";

import { fetcher } from "@/lib/fetcher";
import useSWR from "swr";

interface UseFetchOptions {
  refreshInterval?: number;
  revalidateOnFocus?: boolean;
  keepPreviousData?: boolean;
}

export function useFetch<T>(key: string | null, options?: UseFetchOptions) {
  const { data, error, isLoading, mutate } = useSWR<T>(key, fetcher, {
    revalidateOnFocus: false,
    keepPreviousData: true,
    ...options,
  });

  return {
    data,
    error,
    isLoading,
    mutate,
  };
}
