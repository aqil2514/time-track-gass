export interface WorkSessionDb {
  id: number;
  created_at: string;
  user_id: string;
  start_at: string;
  end_at: string | null;
  stop_mode: string | null;
}

// CLIENT
export interface WorkSessionReport {
  id: string;
  created_at: string;
  app_name: string;
  window_title: string;
  summary: string;
  category: string;
}

export interface WorkSessionItem {
  id: number;
  start_at: string;
  end_at: string | null;
  reports: WorkSessionReport[];
}
