import { AuthUser } from "@/@types/auth";
import { useFetch } from "@/hooks/use-fetch";
import { useMemo } from "react";
import { KeyedMutator } from "swr";

export interface UseUserDataResult {
  data: AuthUser[];
  isLoading: boolean;
  error: Error;
  mutate: KeyedMutator<AuthUser[]>;
}

export function useUserData(): UseUserDataResult {
  const { data, isLoading, error, mutate } = useFetch<AuthUser[]>("/api/user");

  const memoData = useMemo(() => data ?? [], [data]);

  return {
    isLoading,
    error,
    mutate,
    data: memoData,
  };
}
