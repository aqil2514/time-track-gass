import { Profile } from "@/@types/auth";

export interface AttendanceLogsQuery {
  mode: string;

  // Mode Bulanan
  date: string | null;

  // Mode Tahunan
  year: string | null;
  month: string | null;
}

export interface AttendanceSummary {
  id: string;
  fullName: string;
  division: string;
  period: string;
  totalWorkTime: number;
  targetMinutes: number;
  diffMinutes: number;
  isOngoing: boolean;
  status: "Complete" | "Incomplete" | "Process";
  penalty: string;
}

// Fetcher
export interface UserAttendanceList {
  id: number;
  date: string;
  affected_minutes: number;
  adjustment: {
    id: number;
    name: string;
    notes: string;
  };
}

export interface WorkHourHistory {
  id: number;
  work_date: string;
  duration_minutes: number;
}

export interface UserAttendanceDetail {
  listNotes: UserAttendanceList[];
  workHourHistory: WorkHourHistory[];
  profile: Profile;
}
