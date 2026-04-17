export type AdjustmentContentAction = "standby" | "edit" | "detail" | "delete";
export interface AdjustmentContentState {
  action: AdjustmentContentAction;
  adjustmentId: string | null;
}

export type AdjustmentContentReducerAction = {
  type: "SET_ACTION";
  payload: {
    action: AdjustmentContentAction;
    adjustmentId: string | null;
  };
};
