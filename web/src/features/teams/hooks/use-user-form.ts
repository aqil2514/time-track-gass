import React from "react";
import { AddUserSchema } from "../schema/user-schema";
import { AuthUser } from "@/@types/auth";
import axios from "axios";
import { mapUserToSchema } from "../utils/user-mapper";

export function useUserForm(mutate: () => void) {
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [selectedUserData, setSelectedUserData] = React.useState<Partial<AddUserSchema> | null>(null);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleEdit = async (id: string) => {
    setIsSubmitting(true);
    setEditingId(id);
    try {
      const { data } = await axios.get<AuthUser>(`/api/user/${id}`);
      setSelectedUserData(mapUserToSchema(data));
      setIsDialogOpen(true);
    } catch {
      setEditingId(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const onFormSubmit = async (formData: AddUserSchema) => {
    setIsSubmitting(true);
    try {
      if (editingId) {
        await axios.patch(`/api/user/${editingId}`, formData);
      } else {
        await axios.post("/api/user", formData);
      }
      mutate();
      setIsDialogOpen(false);
      setSelectedUserData(null);
      setEditingId(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  return { 
    editingId, 
    selectedUserData, 
    isDialogOpen, 
    setIsDialogOpen, 
    isSubmitting, 
    isFetchingDetail: isSubmitting, // Tambahkan alias di sini
    handleEdit, 
    onFormSubmit, 
    setSelectedUserData 
  };
}