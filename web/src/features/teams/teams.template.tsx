"use client";

import { TeamsHeader } from "./components/teams-header";
import { DataTable } from "@/components/containers/data-table";
import { DeleteUserDialog } from "./components/dialogs/delete-user-dialog"; // Import dialog hapus
import { useTeams as useTeamManagement } from "./providers/teams.provider";
import { TeamProvider } from "./providers/teams.provider";
import { ResetPasswordDialog } from "./components/dialogs/reset-password-dialog";
import { AddFormDialog } from "./components/dialogs/add-form-dialog";
import { EditFormDialog } from "./components/dialogs/edit-form-dialog";
import { TeamsControls } from "./components/teams-controls.soon";
import { filterData } from "./utils/filter-data";
import { useMemo } from "react";
import { getColumns } from "./components/teams-table-columns";

export function TeamsTemplate() {
  return (
    <TeamProvider>
      <InnerTemplate />
    </TeamProvider>
  );
}

const InnerTemplate = () => {
  const { userData, state } = useTeamManagement();

  const columns = useMemo(() => getColumns(), []);

  const memoizedFilteredData = useMemo(
    () => filterData(userData.data || [], state.controller),
    [userData.data, state.controller],
  );

  return (
    <>
      <div className="w-full space-y-6 p-8">
        <TeamsHeader />

        <TeamsControls />
        {userData.isLoading ? (
          <div className="flex h-64 items-center justify-center rounded-xl border border-slate-800 bg-slate-900/50">
            <div className="flex flex-col items-center gap-2">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-700 border-t-blue-600" />
              <p className="text-sm text-slate-500">Memuat data tim...</p>
            </div>
          </div>
        ) : userData.error ? (
          <div className="flex h-64 items-center justify-center rounded-xl border border-red-900/50 bg-red-900/10 text-red-400">
            Terjadi kesalahan saat memuat data.
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={memoizedFilteredData || []}
            emptyMessage="No organization members found."
          />
        )}
      </div>

      <EditFormDialog />
      <AddFormDialog />
      <DeleteUserDialog />
      <ResetPasswordDialog />
    </>
  );
};
