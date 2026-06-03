export interface User {
  role: "worker" | "supervisor" | "developer";
  email: string;
  id: string;
  username: string;
  settings: UserSettings;
}

export type TrackerMode = "auto" | "manual";

export interface UserSettings {
  tracker: {
    mode: TrackerMode;
    allowedMode: TrackerMode[];
  };
}
