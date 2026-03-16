"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useTeams } from "../../providers/teams.provider";
import { useMemo, useState } from "react";
import axios from "axios";

export function DeleteUserDialog() {
  const { dispatch, state, userData } = useTeams();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { modal } = state;
  const user = useMemo(
    () => userData.data.find((user) => user.id === modal.delete.userId),
    [modal.delete.userId, userData.data],
  );

  const open = state.modal.delete.isOpen;

  if (!user) return null;

  const onOpenChange = (open: boolean) =>
    open
      ? dispatch({
          type: "OPEN_DELETE_USER_MODAL",
          payload: {
            userId: user.id,
          },
        })
      : dispatch({ type: "CLOSE_DELETE_USER_MODAL" });

  const onConfirmDelete = async (id: string) => {
    setIsLoading(true);
    try {
      await axios.delete(`/api/user/${id}`);
      userData.mutate();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-slate-900 border-slate-800 text-slate-100">
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription className="text-slate-400">
            This action will remove{" "}
            <span className="font-semibold text-slate-200">
              {user.full_name}
            </span>{" "}
            from the organization. They will no longer be able to access the
            system.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={() => onConfirmDelete(user.id)}
            className="bg-red-600 hover:bg-red-700 text-white border-none"
            disabled={isLoading}
          >
            {isLoading ? "Deleting..." : "Delete User"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
