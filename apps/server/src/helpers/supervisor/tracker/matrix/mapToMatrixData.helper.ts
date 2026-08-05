import { ProfilesDb } from 'src/app/auth/interfaces/profiles.interface';
import {
  AIScreenReportPopulateUser,
  TotalWeeklyActivity,
} from 'src/app/image-upload/interfaces/ai-screen-report.interface';
import { WorkSessionDb } from 'src/app/activities/interface/work_session.interface';
import { AdjustmentContent } from 'src/app/supervisor/_interfaces/attendances/activity-adjusments.interface';

export interface HourlyActivityBreakdown {
  totalActivity: number;
  totalMinutes: number;
  unclassified: { count: number; minutes: number };
  idle: { count: number; minutes: number };
}

export interface MatrixResponse {
  userName: string;
  userId: string;
  fullName: string;
  division: string;
  activity: number[];
  newActivity: HourlyActivityBreakdown[];
  totalWeeklyActivity: number;
  workSession?: WorkSessionDb[];
  workAdjustment?: AdjustmentContent[];
}

export function mapToMatrixData(
  rawData: AIScreenReportPopulateUser[],
  users: ProfilesDb[],
  weeklyActivity: TotalWeeklyActivity[],
  workSession: WorkSessionDb[],
  workAdjustment: AdjustmentContent[],
): MatrixResponse[] {
  return users.map((user) => {
    const selectedActivity = rawData.filter((d) => d.user.id === user.id);
    const selectedWeeklyActivity = weeklyActivity.find((a) => a.user_id === user.id);
    const selectedWorkSession = workSession.filter((s) => s.user_id === user.id);
    const selectedWorkAdjustment = workAdjustment.filter((a) => a.profile.id === user.id);

    const hourlyActivity: number[] = new Array(24).fill(0);
    const newHourlyActivity: HourlyActivityBreakdown[] = Array.from({ length: 24 }, () => ({
      totalActivity: 0,
      totalMinutes: 0,
      unclassified: { count: 0, minutes: 0 },
      idle: { count: 0, minutes: 0 },
    }));

    for (let hour = 0; hour < 24; hour++) {
      const inThisHour = selectedActivity.filter((d) => {
        const wibHour = new Date(
          new Date(d.created_at).getTime() + 7 * 60 * 60 * 1000,
        ).getUTCHours();
        return wibHour === hour;
      });

      const valid = inThisHour.filter((d) => d.category !== 'unclassified' && d.category !== 'idle');
      const unclassified = inThisHour.filter((d) => d.category === 'unclassified');
      const idle = inThisHour.filter((d) => d.category === 'idle');

      hourlyActivity[hour] = valid.length;
      newHourlyActivity[hour].totalActivity = valid.length;
      newHourlyActivity[hour].totalMinutes = valid.reduce((acc, curr) => acc + (curr.interval ?? 0), 0);
      newHourlyActivity[hour].unclassified = {
        count: unclassified.length,
        minutes: unclassified.reduce((acc, curr) => acc + (curr.interval ?? 0), 0),
      };
      newHourlyActivity[hour].idle = {
        count: idle.length,
        minutes: idle.reduce((acc, curr) => acc + (curr.interval ?? 0), 0),
      };
    }

    return {
      fullName: user.full_name,
      division: user.division,
      userId: user.id,
      userName: user.username,
      activity: hourlyActivity,
      newActivity: newHourlyActivity,
      totalWeeklyActivity: selectedWeeklyActivity?.total_minutes ?? 0,
      workSession: selectedWorkSession,
      workAdjustment: selectedWorkAdjustment,
    };
  });
}
