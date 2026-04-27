import { AdjustmentContent } from "@/features/attendance/interfaces/activity-adjustment-list.interface";

export interface WorkSessionDb {
  id: number;
  created_at: string;
  user_id: string;
  start_at: string;
  end_at: string | null;
  stop_mode: string;
}

export interface MatrixResponse {
  userName: string;
  userId: string;
  fullName: string;
  activity: number[];
  totalWeeklyActivity: number;
  workSession?: WorkSessionDb[];
  workAdjustment?: AdjustmentContent[];
}
