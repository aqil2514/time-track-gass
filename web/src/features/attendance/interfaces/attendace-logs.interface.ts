export interface AttendanceLogsQuery {
  mode: string;

  // Mode Bulanan
  date: string | null;

  // Mode Tahunan
  year: string | null;
  month: string | null;
}

export interface AttendanceSummary {
  id:string;
  fullName: string;
  division: string;
  period: string;
  totalWorkTime: number;
  status: 'Complete' | 'Incomplete';
  penalty: string;
}
