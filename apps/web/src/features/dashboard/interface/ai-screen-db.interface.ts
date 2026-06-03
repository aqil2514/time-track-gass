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

export interface AIScreenReportPopulateUser extends Omit<
  AIScreenReportDb,
  'user_id'
> {
  user: {
    role: string;
    email: string;
    division: string;
    username: string;
    full_name: string;
  };
}

export interface AIScreenReportPopulateUserAndS3Image extends Omit<
  AIScreenReportPopulateUser,
  's3_key'
> {
  image_url: string;
}

