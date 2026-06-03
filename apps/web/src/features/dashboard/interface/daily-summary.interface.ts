export interface DailySummaryDb {
  id: string;
  user_id: string;
  date: string;
  summary: string;
  highlights: string[];
  productivity_description: string;
  created_at: string;
}