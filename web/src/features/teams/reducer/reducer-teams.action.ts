import { reducerTeamController } from "./reducer-teams.initial";
import {
  TeamControllerState,
  TeamManagemetState,
  TeamManagemetAction,
  TeamModalState,
} from "./reducer-teams.interface";

export function teamManagemetAction(
  state: TeamManagemetState,
  action: TeamManagemetAction,
): TeamManagemetState {
  return {
    ...state,
    controller: teamControllerAction(state.controller, action),
    modal: teamModalAction(state.modal, action),
  };
}

const teamControllerAction = (
  state: TeamControllerState,
  action: TeamManagemetAction,
): TeamControllerState => {
  switch (action.type) {
    case "SET_TOTAL_USER":
      return { ...state, totalUsers: action.payload };
    case "SET_AVAILABLE_DIVISIONS":
      return { ...state, availableDivisions: action.payload };
    case "SET_DIVISION_VALUE":
      return { ...state, divisionFilter: action.payload };
    case "SET_ROLE_VALUE":
      return { ...state, roleFilter: action.payload };
    case "SET_SEARCH_VALUE":
      return { ...state, searchValue: action.payload };
    case "RESET_CONTROLLER":
      return reducerTeamController;
    default:
      return state;
  }
};

const teamModalAction = (
  state: TeamModalState,
  action: TeamManagemetAction,
): TeamModalState => {
  switch (action.type) {
    case "OPEN_ADD_USER_MODAL":
      return { ...state, add: true };
    case "CLOSE_ADD_USER_MODAL":
      return { ...state, add: false };
    case "OPEN_EDIT_USER_MODAL":
      return { ...state, edit: {isOpen: true, userId: action.payload.userId }};
    case "CLOSE_EDIT_USER_MODAL":
      return { ...state, edit: {isOpen: false, userId: ""} };
    case "OPEN_DELETE_USER_MODAL":
      return { ...state, delete: {isOpen: true, userId: action.payload.userId} };
    case "CLOSE_DELETE_USER_MODAL":
      return { ...state, delete: {isOpen: false, userId: ""} };
    case "OPEN_RESET_PASSWORD_USER_MODAL":
      return {
        ...state,
        resetPassword: { isOpen: true, userId: action.payload.userId },
      };
    case "CLOSE_RESET_PASSWORD_USER_MODAL":
      return { ...state, resetPassword: { isOpen: false, userId:"" } };
    default:
      return state;
  }
};
