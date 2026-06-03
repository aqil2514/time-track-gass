export interface ProfileWorkConfigsDb {
  id: number;
  profile_id: string;
  min_hours_weekly: number;
  min_hours_monthly: number;
  penalty_per_hour: number;
  bonus_per_hour: number;
  penalty_type: string;
  created_at: string;
}

export interface ProfileWorkConfigsPopulateProfile extends Omit<
  ProfileWorkConfigsDb,
  "profile_id"
> {
  profile: {
    id: string;
    username: string;
    full_name: string;
    division: string;
  };
}
