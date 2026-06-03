export interface DailySummaryPerCategory {
  id?: number;
  created_at: Date;
  user_id: string;
  category: string;
  duration: number;
  summary: string;
  date: string;
}

export interface AiSummaryResponse {
  summaries: {
    category: string;
    duration: number;
    summary: string;
  }[];
}