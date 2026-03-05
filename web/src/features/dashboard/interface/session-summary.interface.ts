export interface SessionSummaryDb {
  id: string;
  user_id: string;
  created_at: string;
  session_start: string;
  session_end: string;
  title: string;
  categories: string;
  raw_ids: string[];
}