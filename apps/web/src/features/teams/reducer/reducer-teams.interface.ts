import { AuthUser } from "@/@types/auth";

export interface TeamManagemetState {
  controller: TeamControllerState;
  modal: TeamModalState;
  data: TeamDataState;
}

export type TeamManagemetAction =
  | TeamControllerActionType
  | TeamModalAction
  | TeamDataAction;

export interface TeamControllerState {
  totalUsers: number;
  availableDivisions: string[];
  searchValue: string;
  roleFilter: string;
  divisionFilter: string;
}

export interface TeamModalState {
  add: boolean;
  edit: { isOpen: boolean; userId: string };
  delete: { isOpen: boolean; userId: string };
  resetPassword: { isOpen: boolean; userId: string };
  settings: { isOpen: boolean; userId: string };
}

export interface TeamDataState {
  filteredData: AuthUser[];
}

export type TeamControllerActionType =
  | { type: "SET_TOTAL_USER"; payload: number }
  | { type: "SET_AVAILABLE_DIVISIONS"; payload: string[] }
  | { type: "SET_SEARCH_VALUE"; payload: string }
  | { type: "SET_ROLE_VALUE"; payload: string }
  | { type: "SET_DIVISION_VALUE"; payload: string }
  | { type: "RESET_CONTROLLER" };

export type TeamModalAction =
  | { type: "OPEN_ADD_USER_MODAL" }
  | { type: "CLOSE_ADD_USER_MODAL" }
  | { type: "OPEN_EDIT_USER_MODAL"; payload: { userId: string } }
  | { type: "CLOSE_EDIT_USER_MODAL" }
  | { type: "OPEN_DELETE_USER_MODAL"; payload: { userId: string } }
  | { type: "CLOSE_DELETE_USER_MODAL" }
  | { type: "OPEN_RESET_PASSWORD_USER_MODAL"; payload: { userId: string } }
  | { type: "CLOSE_RESET_PASSWORD_USER_MODAL" }
  | { type: "OPEN_SETTING_USER_MODAL"; payload: { userId: string } }
  | { type: "CLOSE_SETTING_USER_MODAL" };

export type TeamDataAction =
  | { type: "FILTER_NEW_DATA"; payload: AuthUser[] }
  | { type: "RESET_ALL_DATA"; payload: AuthUser[] };
