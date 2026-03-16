import { AuthUser } from "@/@types/auth";
import axios from "axios";
import React from "react";

export function useUserDelete(data: AuthUser[] | undefined, mutate: () => void) {
  const [userToDelete, setUserToDelete] = React.useState<AuthUser | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);

  const handleDeleteClick = (id: string) => {
    const user = data?.find((u) => u.id === id);
    if (user) {
      setUserToDelete(user);
      setIsDeleteDialogOpen(true);
    }
  };

  const onConfirmDelete = async (id: string) => {
    setIsDeleting(true);
    try {
      await axios.delete(`/api/user/${id}`);
      mutate();
      setIsDeleteDialogOpen(false);
      setUserToDelete(null);
    } finally {
      setIsDeleting(false);
    }
  };

  return { userToDelete, isDeleteDialogOpen, setIsDeleteDialogOpen, isDeleting, handleDeleteClick, onConfirmDelete };
}