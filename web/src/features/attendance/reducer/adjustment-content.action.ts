import {
  AdjustmentContentReducerAction,
  AdjustmentContentState,
} from "./adjustment-content.interface";

export function adjustmentContentReducer(
  state: AdjustmentContentState,
  action: AdjustmentContentReducerAction,
) {
  switch (action.type) {
    case "SET_ACTION":
      return {
        ...state,
        action: action.payload.action,
        adjustmentId: action.payload.adjustmentId,
      };
    default:
      return state;
  }
}
