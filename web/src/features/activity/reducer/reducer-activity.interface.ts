import { BaseModalOpen } from "@/@types/general";

export interface ActivityState {
  modal: ActivityModal;
}

export interface ActivityModal {
  openedModal: BaseModalOpen;
  activityId?: string;
}

export type ActivityAction = {
  type: "UPDATE_OPENED_MODAL";
  payload: { activityId?: string; state: BaseModalOpen };
};
