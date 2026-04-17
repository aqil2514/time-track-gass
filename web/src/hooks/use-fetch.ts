"use client";

import { fetcher } from "@/lib/fetcher";
import useSWR, { KeyedMutator } from "swr";

interface UseFetchOptions {
  refreshInterval?: number;
  revalidateOnFocus?: boolean;
  keepPreviousData?: boolean;
}

export interface UseFetchResult<T> {
  data: T | undefined;
  error: Error;
  isLoading: boolean;
  mutate: KeyedMutator<T>;
  isValidating: boolean;
}

export function useFetch<T>(
  key: string | null,
  options?: UseFetchOptions,
): UseFetchResult<T> {
  const { data, error, isLoading, mutate, isValidating } = useSWR<T>(
    key,
    fetcher,
    {
      revalidateOnFocus: false,
      keepPreviousData: true,
      ...options,
    },
  );

  return {
    data,
    error,
    isLoading,
    mutate,
    isValidating,
  };
}
