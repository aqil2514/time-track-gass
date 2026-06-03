import { BaseModalOpen } from "@/@types/general";

export interface DivisionState {
  modal: DivisionsModal;
}

export interface DivisionsModal {
  openedModal: BaseModalOpen;
  divisionId?: number;
}

export type DivisionAction = {
  type: "UPDATE_OPENED_MODAL";
  payload: { divisionId?: number; state: BaseModalOpen };
};
