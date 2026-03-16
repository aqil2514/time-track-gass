"use client";

import { Input } from "@/components/ui/input";
import { Search, Users, Filter, X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useTeams } from "../providers/teams.provider";
import { useMemo } from "react";

export function TeamsControls() {
  const { state, dispatch, userData } = useTeams();
  // Gunakan fallback agar tidak undefined saat awal load
  const { 
    searchValue = "", 
    roleFilter = "all", 
    divisionFilter = "all" 
  } = state.controller;

  const data = userData.data;

  // Derived State untuk badge total
  const totalCount = data?.length || 0;

  const availableDivisions = useMemo(() => {
    if (!data) return [];
    const divisions = data
      .map((user) => user.division)
      .filter((division): division is string => !!division);

    return Array.from(new Set(divisions)).sort();
  }, [data]);

  const hasActiveFilters =
    searchValue !== "" || roleFilter !== "all" || divisionFilter !== "all";

  return (
    <div className="flex flex-col gap-4 bg-slate-900/40 p-4 rounded-xl border border-slate-800/60 shadow-sm">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <Input
            value={searchValue}
            onChange={(e) =>
              dispatch({ type: "SET_SEARCH_VALUE", payload: e.target.value })
            }
            placeholder="Search name, email, or username..."
            className="pl-10 bg-slate-950 border-slate-800 text-slate-200"
          />
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-lg shrink-0">
          <Users className="h-4 w-4 text-blue-400" />
          <span className="text-sm font-medium text-blue-300">
            {totalCount} <span className="text-blue-400/60 ml-0.5">Total Members</span>
          </span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-800/50">
        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider mr-2">
          <Filter className="h-3 w-3" /> Filter By
        </div>

        <Select
          value={roleFilter}
          onValueChange={(val) => dispatch({ type: "SET_ROLE_VALUE", payload: val })}
        >
          <SelectTrigger className="w-32 h-9 bg-slate-950 border-slate-800 text-xs text-slate-300">
            <SelectValue placeholder="All Roles" />
          </SelectTrigger>
          <SelectContent className="bg-slate-900 border-slate-800 text-slate-300">
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="supervisor">Supervisor</SelectItem>
            <SelectItem value="worker">Worker</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={divisionFilter}
          onValueChange={(val) => dispatch({ type: "SET_DIVISION_VALUE", payload: val })}
        >
          {/* Typo fixed here: w-40 bg-... */}
          <SelectTrigger className="w-40 h-9 bg-slate-950 border-slate-800 text-xs text-slate-300">
            <SelectValue placeholder="All Divisions" />
          </SelectTrigger>
          <SelectContent className="bg-slate-900 border-slate-800 text-slate-300">
            <SelectItem value="all">All Divisions</SelectItem>
            {availableDivisions.map((division) => (
              <SelectItem key={division} value={division}>
                {division}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => dispatch({ type: "RESET_CONTROLLER" })}
            className="h-8 text-xs text-slate-400 hover:text-slate-100"
          >
            <X className="mr-1 h-3 w-3" /> Reset
          </Button>
        )}
      </div>
    </div>
  );
}