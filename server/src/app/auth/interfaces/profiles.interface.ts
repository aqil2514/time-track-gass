export interface ProfilesDb {
  id: string;
  full_name: string;
  username: string;
  email: string;
  password: string;
  role: string;
  division: string;
  division_id: number;
  created_at: string;
  updated_at?: string;
  settings: UserSettings;
}

export type ProfilesDbInsert = Omit<ProfilesDb, 'created_at' | 'id'>;

export type ProfilesWithNoPassword = Omit<ProfilesDb, 'password'>;

export type ProfileIdAndUsername = Pick<
  ProfilesDb,
  'username' | 'id' | 'division'
>;

export type TrackerMode = 'auto' | 'manual';

export interface UserSettings {
  tracker: {
    mode: TrackerMode;
    allowedMode: TrackerMode[];
  };
}
