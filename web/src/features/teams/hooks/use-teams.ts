"use client";

import * as React from "react";
import { AuthUser } from "@/@types/auth";
import { useFetch } from "@/hooks/use-fetch";
import { useUserDelete } from "./use-user-delete";
import { getColumns } from "../components/teams-table-columns";

export function useTeams() {
  const { data, isLoading, error, mutate } = useFetch<AuthUser[]>("/api/user");

  // Filter States
  const [search, setSearch] = React.useState("");
  const [roleFilter, setRoleFilter] = React.useState("all");
  const [divisionFilter, setDivisionFilter] = React.useState("all");

  // Hooks Modular
  const deletion = useUserDelete(data, mutate);

  // Ambil daftar divisi unik dari data yang difetch
  const availableDivisions = React.useMemo(() => {
    if (!data) return [];
    const divisions = data
      .map((user) => user.division)
      .filter((division): division is string => !!division);

    return Array.from(new Set(divisions)).sort();
  }, [data]);

  // Logic Filtering Lokal (Search + Role + Division)
  const filteredData = React.useMemo(() => {
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

  const columns = React.useMemo(() => getColumns(), []);

  return {
    // Filtered data for Table
    data: filteredData,
    totalRaw: data?.length || 0,
    availableDivisions,

    // Status
    isLoading,
    error,

    // Filter Controls
    search,
    setSearch,
    roleFilter,
    setRoleFilter,
    divisionFilter,
    setDivisionFilter,

    // Table Config
    columns,

    // Modals & Actions Logic
    ...deletion,
  };
}
