import { AuthUser } from "@/@types/auth";
import { AddUserSchema } from "../schema/user-schema";

export const mapUserToSchema = (user: AuthUser): Partial<AddUserSchema> => ({
  fullName: user.full_name,
  username: user.username,
  email: user.email,
  division: String(user.division_id),
  role: (user.role === "supervisor" || user.role === "worker") ? user.role : "worker",
});