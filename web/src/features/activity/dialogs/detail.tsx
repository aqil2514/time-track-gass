"use client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useActivity } from "../provider/activity.provider";

export function DetailDialog() {
  const { state, dispatch } = useActivity();

  const open = state.modal.openedModal === "detail";
  const activityId = state.modal.activityId;

  return (
    <Dialog
      open={open}
      onOpenChange={(open) => {
        if (!open)
          dispatch({ type: "UPDATE_OPENED_MODAL", payload: { state: null } });
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Detail Aktivitas</DialogTitle>
          <DialogDescription>
            This action cannot be undone. This will permanently delete your
            account and remove your data from our servers.
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}
