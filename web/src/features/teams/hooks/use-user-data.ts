import { AuthUser } from "@/@types/auth";
import { useFetch } from "@/hooks/use-fetch";
import { useMemo } from "react";
import { KeyedMutator } from "swr";
import {
  TeamManagemetState,
} from "../reducer/reducer-teams.interface";

export interface UseUserDataResult {
  data: AuthUser[];
  isLoading: boolean;
  error: Error;
  mutate: KeyedMutator<AuthUser[]>;
  filteredData: AuthUser[];
}

export function useUserData(
  state: TeamManagemetState,
): UseUserDataResult {
  const { data, isLoading, error, mutate } = useFetch<AuthUser[]>("/api/user");
  const { roleFilter, divisionFilter, searchValue: search } = state.controller;

  const memoData = useMemo(() => data ?? [], [data]);

  const filteredData = useMemo(() => {
    if (!data) return [];

    return data.filter((user) => {
      const matchesSearch =
        user.full_name.toLowerCase().includes(search.toLowerCase()) ||
        user.email.toLowerCase().includes(search.toLowerCase()) ||
        user.username.toLowerCase().includes(search.toLowerCase());

      const matchesRole = roleFilter === "all" || user.role === roleFilter;
      const matchesDivision =
        divisionFilter === "all" || user.division === divisionFilter;

      return matchesSearch && matchesRole && matchesDivision;
    });
  }, [data, search, roleFilter, divisionFilter]);

  return {
    isLoading,
    error,
    mutate,
    data: memoData,
    filteredData,
  };
}
