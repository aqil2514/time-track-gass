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
import { AddUserSchema } from "../../schema/user-schema";
import axios, { isAxiosError } from "axios";
import { mutate } from "swr";

export function AddFormDialog() {
  const { state, dispatch } = useTeams();

  const open = state.modal.add;
  const onOpenChange = (open: boolean) =>
    open
      ? dispatch({ type: "OPEN_ADD_USER_MODAL" })
      : dispatch({ type: "CLOSE_ADD_USER_MODAL" });

  const handleAddUser = async (data: AddUserSchema) => {
    try {
      const response = await axios.post("/api/user", data);

      if (response.status === 200 || response.status === 201) {
        mutate("/api/user");
        dispatch({ type: "CLOSE_ADD_USER_MODAL" });
      }
    } catch (error) {
      if (isAxiosError(error)) {
        const errorMessage =
          error.response?.data?.message || "Failed to create user";
        alert(errorMessage);
        console.error("Add user error:", errorMessage);
      } else {
        alert("An unexpected error occurred");
        console.error("An unexpected error occurred:", error);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-slate-900 border-slate-800 text-slate-100">
        <DialogHeader>
          <DialogTitle>Add New User</DialogTitle>
          <DialogDescription className="text-slate-400">
            Register a new organization member.
          </DialogDescription>
        </DialogHeader>

        <UserForm onSubmit={handleAddUser} />

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
