import { ProfilesDb } from 'src/app/auth/interfaces/profiles.interface';
import { DailyActivityRaw } from './getDateRangeActivity.helper';

export interface MultiDayMatrixEntry {
  date: string;
  totalActivity: number;
  totalMinutes: number;
}

export interface MultiDayMatrixResponse {
  userId: string;
  userName: string;
  fullName: string;
  division: string;
  dailyActivity: MultiDayMatrixEntry[];
}

export function mapToMultiDayMatrix(
  users: ProfilesDb[],
  rawData: DailyActivityRaw[],
): MultiDayMatrixResponse[] {
  return users.map((user) => {
    const userRows = rawData.filter((r) => r.user_id === user.id);

    const dailyActivity: MultiDayMatrixEntry[] = userRows.map((r) => ({
      date: r.date,
      totalActivity: r.total_activity,
      totalMinutes: r.total_minutes,
    }));

    return {
      userId: user.id,
      userName: user.username,
      fullName: user.full_name,
      division: user.division,
      dailyActivity,
    };
  });
}
