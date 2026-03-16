"use client";

import { TeamsHeader } from "./components/teams-header";
import { DataTable } from "@/components/containers/data-table";
import { UserFormDialog } from "./components/user-form-dialog";
import { DeleteUserDialog } from "./components/delete-user-dialog"; // Import dialog hapus
import { useTeams } from "./hooks/use-teams";

export function TeamsTemplate() {
  const {
    data,
    isLoading,
    error,
    columns,
    // State Form (Add/Edit)
    isDialogOpen,
    setIsDialogOpen,
    selectedUserData,
    setSelectedUserData,
    isFetchingDetail,
    onFormSubmit,
    // State Delete
    userToDelete,
    isDeleteDialogOpen,
    setIsDeleteDialogOpen,
    isDeleting,
    onConfirmDelete,
  } = useTeams();

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

      {/* Dialog untuk Tambah & Edit User */}
      <UserFormDialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) setSelectedUserData(null);
        }}
        initialData={
          selectedUserData ?? {
            fullName: "",
            username: "",
            email: "",
            division: "",
            role: "worker",
            password: "",
            confirmPassword: "",
          }
        }
        onSubmit={onFormSubmit}
        isLoading={isFetchingDetail}
      />

      {/* Dialog untuk Konfirmasi Hapus User */}
      <DeleteUserDialog
        user={userToDelete}
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={onConfirmDelete}
        isLoading={isDeleting}
      />
    </div>
  );
}