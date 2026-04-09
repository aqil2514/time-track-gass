import { AuthUser } from "@/@types/auth";
import { useMemo } from "react";
import { TeamManagemetState } from "../reducer/reducer-teams.interface";

export interface UseUserFilterResult {
  filteredData: AuthUser[];
}

export function useUserFilter(data: AuthUser[], state: TeamManagemetState) {
  const { roleFilter, divisionFilter, searchValue: search } = state.controller;

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

  return { filteredData };
}
