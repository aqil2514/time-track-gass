export interface ProfileWorkConfigsDb {
  id: number;
  profile_id: string;
  min_hours_weekly: number;
  min_hours_monthly: number;
  penalty_per_hour: number;
  bonus_per_hour: number;
  created_at: string;
}
