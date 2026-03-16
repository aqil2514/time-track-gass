"use client";

import { TeamsHeader } from "./components/teams-header";
import { columns } from "./components/teams-table-columns";
import { DataTable } from "@/components/containers/data-table";
import { useFetch } from "@/hooks/use-fetch";
import { AuthUser } from "@/@types/auth";

export function TeamsTemplate() {
  const { data, isLoading, error } = useFetch<AuthUser[]>("/api/user");

  return (
    <div className="w-full space-y-6 p-8">
      <TeamsHeader />

      {isLoading ? (
        <div className="flex h-64 items-center justify-center rounded-xl border border-slate-800 bg-slate-900/50">
          <div className="flex flex-col items-center gap-2">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-700 border-t-blue-600" />
            <p className="text-sm text-slate-500">Memuat data tim...</p>
          </div>
        </div>
      ) : error ? (
        <div className="flex h-64 items-center justify-center rounded-xl border border-red-900/50 bg-red-900/10 text-red-400">
          Terjadi kesalahan saat memuat data.
        </div>
      ) : (
        <DataTable 
          columns={columns} 
          data={data || []} 
          emptyMessage="No organization members found."
        />
      )}
    </div>
  );
}