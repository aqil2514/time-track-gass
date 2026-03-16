"use client";

import * as React from "react";
import axios, { isAxiosError } from "axios";
import { useFetch } from "@/hooks/use-fetch";
import { AuthUser } from "@/@types/auth";
import { AddUserSchema } from "../schema/user-schema";
import { getColumns } from "../components/teams-table-columns";

export function useTeams() {
  const { data, isLoading, error, mutate } = useFetch<AuthUser[]>("/api/user");
  
  // State untuk Edit/Add
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [selectedUserData, setSelectedUserData] = React.useState<Partial<AddUserSchema> | null>(null);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [isFetchingDetail, setIsFetchingDetail] = React.useState(false);

  // State untuk Delete
  const [userToDelete, setUserToDelete] = React.useState<AuthUser | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);

  // --- Logic Edit ---
  const handleEdit = React.useCallback(async (id: string) => {
    setIsFetchingDetail(true);
    setEditingId(id);
    try {
      const response = await axios.get<AuthUser>(`/api/user/${id}`);
      const user = response.data;

      const mappedData: Partial<AddUserSchema> = {
        fullName: user.full_name,
        username: user.username,
        email: user.email,
        division: user.division,
        role: (user.role === "supervisor" || user.role === "worker") ? user.role : "worker",
      };

      setSelectedUserData(mappedData);
      setIsDialogOpen(true);
    } catch (err) {
      if (isAxiosError(err)) {
        console.error("Gagal mengambil detail user:", err.response?.data?.message);
      }
      setEditingId(null);
    } finally {
      setIsFetchingDetail(false);
    }
  }, []);

  // --- Logic Delete Click ---
  const handleDeleteClick = React.useCallback((id: string) => {
    const user = data?.find((u) => u.id === id);
    if (user) {
      setUserToDelete(user);
      setIsDeleteDialogOpen(true);
    }
  }, [data]);

  // --- Logic Confirm Delete ---
  const onConfirmDelete = async (id: string) => {
    setIsDeleting(true);
    try {
      await axios.delete(`/api/user/${id}`);
      mutate(); // Refresh tabel
      setIsDeleteDialogOpen(false);
      setUserToDelete(null);
    } catch (err) {
      if (isAxiosError(err)) {
        console.error("Gagal menghapus user:", err.response?.data?.message);
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const onFormSubmit = async (formData: AddUserSchema) => {
    setIsFetchingDetail(true);
    try {
      if (editingId) {
        // Mode Edit
        await axios.patch(`/api/user/${editingId}`, formData);
      } else {
        // Mode Add (Jika dipicu dari sini)
        await axios.post("/api/user", formData);
      }

      mutate();
      setIsDialogOpen(false);
      setSelectedUserData(null);
      setEditingId(null); 
    } catch (err) {
      if (isAxiosError(err)) {
        console.error("Submit failed:", err.response?.data?.message);
      }
    } finally {
      setIsFetchingDetail(false);
    }
  };

  const columns = React.useMemo(
    () => getColumns(
      (id) => handleEdit(id),
      (id) => handleDeleteClick(id)
    ),
    [handleEdit, handleDeleteClick]
  );

  return {
    // Data & Table
    data,
    isLoading,
    error,
    columns,
    
    // Form Dialog (Add/Edit)
    isDialogOpen,
    setIsDialogOpen,
    selectedUserData,
    setSelectedUserData,
    isFetchingDetail,
    onFormSubmit,

    // Delete Dialog
    userToDelete,
    isDeleteDialogOpen,
    setIsDeleteDialogOpen,
    isDeleting,
    onConfirmDelete
  };
}