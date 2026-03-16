import { TeamManagemetAction, TeamModalAction } from "./reducer-teams.interface";

export function isModalAction(action: TeamManagemetAction): action is TeamModalAction {
  return action.type.includes("_MODAL");
}