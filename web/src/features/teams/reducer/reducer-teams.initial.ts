import {
  TeamControllerState,
  TeamManagemetState,
  TeamModalState,
} from "./reducer-teams.interface";

export const reducerTeamController: TeamControllerState = {
  availableDivisions: [],
  divisionFilter: "",
  roleFilter: "",
  searchValue: "",
  totalUsers: 0,
};

export const reducerTeamModal: TeamModalState = {
  add: false,
  delete: false,
  edit: false,
  resetPassword: {isOpen:false, userId:""},
};

export const reducerTeamInitial: TeamManagemetState = {
  controller: reducerTeamController,
  modal: reducerTeamModal,
};
