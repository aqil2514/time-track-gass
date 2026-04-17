import { useFetch, UseFetchResult } from "@/hooks/use-fetch";
import React, {
  ActionDispatch,
  createContext,
  useContext,
  useMemo,
  useReducer,
} from "react";
import { useSummaryAttendance } from "./summary.provider";
import { buildUrl } from "@/utils/build-url";
import { webUrl } from "@/constants/server-url";
import { AdjustmentContentResponse } from "../interfaces/activity-adjustment-list.interface";
import {
  AdjustmentContentReducerAction,
  AdjustmentContentState,
} from "../reducer/adjustment-content.interface";
import { adjustmentContentInitialState } from "../reducer/adjustment-content.state";
import { adjustmentContentReducer } from "../reducer/adjustment-content.action";

interface AdjustmentContentContextType extends UseFetchResult<AdjustmentContentResponse> {
  state: AdjustmentContentState;
  dispatch: ActionDispatch<[action: AdjustmentContentReducerAction]>;
}

const AdjustmentContentContext = createContext<AdjustmentContentContextType>(
  {} as AdjustmentContentContextType,
);

export function AdjustmentContentProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { query } = useSummaryAttendance();
  const [state, dispatch] = useReducer(
    adjustmentContentReducer,
    adjustmentContentInitialState,
  );

  const url = useMemo<string | null>(() => {
    const { mode, date, month, year } = query;

    if (mode === "weekly") {
      if (!date) return null;
      return buildUrl("/api/attendance/adjustment", webUrl, query);
    }

    if (mode === "monthly") {
      if (!month || !year) return null;
      return buildUrl("/api/attendance/adjustment", webUrl, query);
    }

    return null;
  }, [query]);

  const fetcher = useFetch<AdjustmentContentResponse>(url);

  const values: AdjustmentContentContextType = {
    ...fetcher,

    state,
    dispatch,
  };

  return (
    <AdjustmentContentContext.Provider value={values}>
      {children}
    </AdjustmentContentContext.Provider>
  );
}

export const useAdjustmentContent = () => useContext(AdjustmentContentContext);
