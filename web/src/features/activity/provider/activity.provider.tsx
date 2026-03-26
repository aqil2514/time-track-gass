"use client";
import React, {
  ActionDispatch,
  createContext,
  useContext,
  useReducer,
} from "react";
import {
  useUserActivityTracker,
  UseUserActivityTrackerResult,
} from "../hooks/use-user-actitivity-tracker";
import {
  ActivityAction,
  ActivityState,
} from "../reducer/reducer-activity.interface";
import { activityAction } from "../reducer/reducer-activity.action";
import { activityReducerInitial } from "../reducer/reducer-activity.initial";

interface ActivityProviderTypes {
  state: ActivityState;
  dispatch: ActionDispatch<[action: ActivityAction]>;
  data: UseUserActivityTrackerResult;
}

const ActivityContext = createContext<ActivityProviderTypes>(
  {} as ActivityProviderTypes,
);

export function ActivityProvider({ children }: { children: React.ReactNode }) {
  const data = useUserActivityTracker();
  const [state, dispatch] = useReducer(activityAction, activityReducerInitial);

  const values: ActivityProviderTypes = {
    data,
    state,
    dispatch,
  };

  return (
    <ActivityContext.Provider value={values}>
      {children}
    </ActivityContext.Provider>
  );
}

export const useActivity = () => useContext(ActivityContext);
