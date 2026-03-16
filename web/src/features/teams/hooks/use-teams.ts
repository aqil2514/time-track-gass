import { AuthUser } from "@/@types/auth";
import { useFetch } from "@/hooks/use-fetch";
import { useUserDelete } from "./use-user-delete";
import { useUserForm } from "./use-user-form";
import React from "react";
import { getColumns } from "../components/teams-table-columns";

export function useTeams() {
  const { data, isLoading, error, mutate } = useFetch<AuthUser[]>("/api/user");

  const form = useUserForm(mutate);
  const deletion = useUserDelete(data, mutate);

  const columns = React.useMemo(
    () => getColumns(form.handleEdit, deletion.handleDeleteClick),
    [form.handleEdit, deletion.handleDeleteClick]
  );

  return {
    data, isLoading, error, columns,
    ...form,
    ...deletion
  };
}