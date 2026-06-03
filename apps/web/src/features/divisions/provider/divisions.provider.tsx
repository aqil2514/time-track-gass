"use client";
import React, {
  ActionDispatch,
  createContext,
  useContext,
  useReducer,
} from "react";
import {
  useDivisions,
  UseDivisionsResult,
} from "../hooks/use-divisions";
import { DivisionAction, DivisionState } from "../reducer/reducer-divisions.interface";
import { divisionAction } from "../reducer/reducer-divisions.action";
import { divisionReducerInitial } from "../reducer/reducer-divisions.initial";

interface DivisionsProviderTypes {
  state: DivisionState;
  dispatch: ActionDispatch<[action: DivisionAction]>;
  data: UseDivisionsResult;
}

const DivisionsContext = createContext<DivisionsProviderTypes>(
  {} as DivisionsProviderTypes,
);

export function DivisionsProvider({ children }: { children: React.ReactNode }) {
  const data = useDivisions();
  const [state, dispatch] = useReducer(divisionAction, divisionReducerInitial);

  const values: DivisionsProviderTypes = {
    data,
    state,
    dispatch,
  };

  return (
    <DivisionsContext.Provider value={values}>
      {children}
    </DivisionsContext.Provider>
  );
}

export const useDivisionContext = () => useContext(DivisionsContext);
