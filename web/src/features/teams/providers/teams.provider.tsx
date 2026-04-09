import { ActionDispatch, createContext, useContext, useReducer } from "react";
import { teamManagemetAction } from "../reducer/reducer-teams.action";
import { reducerTeamInitial } from "../reducer/reducer-teams.initial";
import {
  TeamManagemetAction,
  TeamManagemetState,
} from "../reducer/reducer-teams.interface";
import { useUserData, UseUserDataResult } from "../hooks/use-user-data";

interface TeamManagemetContext {
  state: TeamManagemetState;
  dispatch: ActionDispatch<[action: TeamManagemetAction]>;
  userData: UseUserDataResult;
}

const TeamsContext = createContext<TeamManagemetContext>(
  {} as TeamManagemetContext,
);

export function TeamProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(teamManagemetAction, reducerTeamInitial);
  const userData = useUserData();

  const values: TeamManagemetContext = {
    dispatch,
    state,
    userData,
  };

  return (
    <TeamsContext.Provider value={values}>{children}</TeamsContext.Provider>
  );
}

export const useTeams = () => useContext(TeamsContext);
