import { DivisionAction, DivisionState } from "./reducer-divisions.interface";

export function divisionAction(
  state: DivisionState,
  action: DivisionAction,
): DivisionState {
  switch (action.type) {
    case "UPDATE_OPENED_MODAL":
      return {
        modal: {
          openedModal: action.payload.state,
          divisionId: action.payload.divisionId,
        },
      };

    default:
      return state;
  }
}
