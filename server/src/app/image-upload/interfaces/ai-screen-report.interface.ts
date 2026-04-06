export interface AIScreenReportDb {
  id: string;
  created_at: string;
  app_name: string;
  window_title: string;
  category: string;
  summary: string;
  user_id: string;
  s3_key: string;
}

export interface AIScreenReportPopulateUser extends Omit<
  AIScreenReportDb,
  'user_id'
> {
  user: {
    id: string;
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

export type AIScreenReportDbInsert = Omit<
  AIScreenReportDb,
  'id' | 'created_at'
>;

export interface TotalWeeklyActivity {
  user_id: string;
  total_activity: number;
}
