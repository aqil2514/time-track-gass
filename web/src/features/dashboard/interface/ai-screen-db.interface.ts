export type ActivityType =
  | "coding"
  | "debugging"
  | "research"
  | "database"
  | "devops"
  | "review"
  | "meeting"
  | "communication"
  | "design"
  | "planning";

export interface AIScreenReportDb {
  id: string;
  created_at: string;
  app_name: string;
  window_title: string;
  category: ActivityType;
  summary: string;
  user_id: string;
  s3_key: string;
}
