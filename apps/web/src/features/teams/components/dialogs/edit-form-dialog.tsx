"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useTeams } from "../../providers/teams.provider";
import { UserForm } from "../forms";
import { mapUserToSchema } from "../../utils/user-mapper";
import { useFetch } from "@/hooks/use-fetch";
import { AuthUser } from "@/@types/auth";
import { buildUrl } from "@/utils/build-url";
import { webUrl } from "@/constants/server-url";
import { AddUserSchema } from "../../schema/user-schema";
import axios, { isAxiosError } from "axios";

export function EditFormDialog() {
  const { state, dispatch, userData } = useTeams();

  const open = state.modal.edit.isOpen;
  const userId = state.modal.edit.userId
  const onOpenChange = (open: boolean) =>
    open
      ? dispatch({
          type: "OPEN_EDIT_USER_MODAL",
          payload: { userId: state.modal.edit.userId },
        })
      : dispatch({ type: "CLOSE_EDIT_USER_MODAL" });

  const url = open
    ? buildUrl(`api/user/${userId}`, webUrl)
    : null;

  const rawData = useFetch<AuthUser>(url);

  if (!rawData.data || !userId) return null;

  const defaultValues = mapUserToSchema(rawData.data);

  const onFormSubmit = async (formData: AddUserSchema) => {
    try {
      await axios.patch(`/api/user/${userId}`, formData);
      userData.mutate();
      rawData.mutate();
      dispatch({ type: "CLOSE_EDIT_USER_MODAL" });
    } catch (error) {
      if (isAxiosError(error)) {
        const errorMessage =
          error.response?.data?.message || "Failed to save data";
        alert(errorMessage);
      } else {
        alert("An unexpected error occurred");
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-slate-900 border-slate-800 text-slate-100">
        <DialogHeader>
          <DialogTitle>Edit User.</DialogTitle>
          <DialogDescription className="text-slate-400">
            Update User details.
          </DialogDescription>
        </DialogHeader>

        <UserForm onSubmit={onFormSubmit} defaultValues={defaultValues} />

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-slate-800 text-slate-400"
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
