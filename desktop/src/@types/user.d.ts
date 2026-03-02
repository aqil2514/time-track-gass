export interface User {
  role: "worker" | "supervisor" | "developer";
  email: string;
  id: string;
  username: string;
}
