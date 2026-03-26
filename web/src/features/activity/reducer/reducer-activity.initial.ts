import { ActivityState } from "./reducer-activity.interface";

export const activityReducerInitial: ActivityState = {
  modal: {
    openedModal: null,
    activityId: undefined,
  },
};
