export interface ProfilesDb {
  id: string;
  full_name: string;
  username: string;
  email: string;
  password: string;
  role: string;
  division: string;
  created_at: string;
  updated_at?: string;
}

export type ProfilesDbInsert = Omit<ProfilesDb, | "created_at" | "id">

export type ProfilesWithNoPassword = Omit<ProfilesDb, 'password'>

export type ProfileIdAndUsername = Pick<ProfilesDb, "username" | "id">