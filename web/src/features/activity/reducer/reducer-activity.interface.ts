import { BaseModalOpen } from "@/@types/general";

type ActivityModalOpen = "bulk-delete" | "bulk-edit-category" | BaseModalOpen;

export interface ActivityState {
  modal: ActivityModal;
}

export interface ActivityModal {
  openedModal: ActivityModalOpen;
  activityId?: string;
  activityIds?: string[];
}

export type ActivityAction = {
  type: "UPDATE_OPENED_MODAL";
  payload: { activityId?: string; state: ActivityModalOpen; activityIds?:string[] };
};
