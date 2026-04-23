import { AIScreenReportDb } from "./ai-record.type";
import { DailySummaryDb } from "./daily-summary.type";
import { SessionSummaryDb } from "./session-summary.type";

export interface ActivityData extends Omit<SessionSummaryDb, "raw_ids"> {
  items: AIScreenReportDb[];
}

export interface DailySummaryResponse {
  user_id: string;
  report_date: string;
  total_count: number;
  total_work_time_minutes: number;
}

export interface WeeklySummaryResponse {
  user_id: string;
  week_start: string;
  week_end: string;
  total_work_time_minutes: number;
}

export interface ActivityAdjustment {
  adjustment: {
    name: string;
  };
  affected_minutes: number;
  date: string;
}

export interface UserSummaryTimeResponse {
  dailySummaryTime: DailySummaryResponse;
  weeklySummaryTime: WeeklySummaryResponse;
  activityAdjustment: ActivityAdjustment[];
}

export interface ActivityResponse extends UserSummaryTimeResponse {
  activities: ActivityData[];
}

export interface HomeData {
  activityData: ActivityData[];
  totalWork: UserSummaryTimeResponse;
  dailyActivity: DailySummaryDb;
}
