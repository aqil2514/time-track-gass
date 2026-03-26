import { ActivityAction, ActivityState } from "./reducer-activity.interface";

export function activityAction(
  state: ActivityState,
  action: ActivityAction,
): ActivityState {
  switch (action.type) {
    case "UPDATE_OPENED_MODAL":
      return {
        modal: {
          openedModal: action.payload.state,
          activityId: action.payload.activityId,
        },
      };

    default:
      return state;
  }
}
