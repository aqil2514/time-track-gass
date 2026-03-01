export interface AIScreenReportDb {
  id: string;
  created_at: string;
  app_name: string;
  window_title: string;
  category: string;
  summary: string;
}

export type AIScreenReportDbInsert = Omit<AIScreenReportDb, "id" | 'created_at'>