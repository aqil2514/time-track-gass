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

interface TeamsControlsProps {
  totalUsers: number;
  availableDivisions: string[];
  searchValue: string;
  onSearchChange: (value: string) => void;
  roleFilter: string;
  onRoleChange: (value: string) => void;
  divisionFilter: string;
  onDivisionChange: (value: string) => void;
}

export function TeamsControls({
  totalUsers,
  availableDivisions,
  searchValue,
  onSearchChange,
  roleFilter,
  onRoleChange,
  divisionFilter,
  onDivisionChange,
}: TeamsControlsProps) {
  const hasActiveFilters = searchValue !== "" || roleFilter !== "all" || divisionFilter !== "all";

  return (
    <div className="flex flex-col gap-4 bg-slate-900/40 p-4 rounded-xl border border-slate-800/60 shadow-sm">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search Bar */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <Input
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search name, email, or username..."
            className="pl-10 bg-slate-950 border-slate-800 text-slate-200 focus-visible:ring-blue-600/50"
          />
        </div>

        {/* Total Badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-lg shrink-0">
          <Users className="h-4 w-4 text-blue-400" />
          <span className="text-sm font-medium text-blue-300">
            {totalUsers} <span className="text-blue-400/60 ml-0.5">Total Members</span>
          </span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-800/50">
        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider mr-2">
          <Filter className="h-3 w-3" /> Filter By
        </div>

        {/* Role Filter */}
        <Select value={roleFilter} onValueChange={onRoleChange}>
          <SelectTrigger className="w-35 h-9 bg-slate-950 border-slate-800 text-xs text-slate-300">
            <SelectValue placeholder="All Roles" />
          </SelectTrigger>
          <SelectContent className="bg-slate-900 border-slate-800 text-slate-300">
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="supervisor">Supervisor</SelectItem>
            <SelectItem value="worker">Worker</SelectItem>
          </SelectContent>
        </Select>

        {/* Dynamic Division Filter */}
        <Select value={divisionFilter} onValueChange={onDivisionChange}>
          <SelectTrigger className="w-40bg-slate-950 border-slate-800 text-xs text-slate-300">
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

        {/* Reset Button */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              onSearchChange("");
              onRoleChange("all");
              onDivisionChange("all");
            }}
            className="h-8 text-xs text-slate-400 hover:text-slate-100 hover:bg-slate-800 px-2"
          >
            <X className="mr-1 h-3 w-3" /> Reset
          </Button>
        )}
      </div>
    </div>
  );
}