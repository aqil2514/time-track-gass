import { ProfilesDb } from 'src/app/auth/interfaces/profiles.interface';

export interface AttendanceLogsDb {
  id: number;
  profile_id: string;
  work_date: string;
  duration_minutes: number;
  created_at: string;
}

export interface AttendanceLogsDbInsert extends Omit<
  AttendanceLogsDb,
  'id' | 'created_at'
> { }

export interface AttendanceLogsDbPopulatedProfile extends Omit<
  AttendanceLogsDb,
  'profile_id'
> {
  profile: ProfilesDb;
}

export interface AttendanceLogsRpc {
  user_id: string;
  date: string;
  count: number;
  total_work_time: number;
  full_name: string;
  username: string;
  division: string
}

export interface AttendanceSummary {
  id: string;
  fullName: string;
  division: string;
  period: string;
  totalWorkTime: number;
  targetMinutes: number;
  diffMinutes: number;
  isOngoing: boolean;
  status: 'Complete' | 'Incomplete' | 'Process';
  penalty: string;
}
