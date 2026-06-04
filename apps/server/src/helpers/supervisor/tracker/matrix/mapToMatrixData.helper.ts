import { ProfilesDb } from 'src/app/auth/interfaces/profiles.interface';
import {
  AIScreenReportPopulateUser,
  TotalWeeklyActivity,
} from 'src/app/image-upload/interfaces/ai-screen-report.interface';
import { WorkSessionDb } from 'src/app/activities/interface/work_session.interface';
import { AdjustmentContent } from 'src/app/supervisor/interfaces/attendances/activity-adjusments.interface';

export interface MatrixResponse {
  userName: string;
  userId: string;
  fullName: string;
  division: string;
  activity: number[];
  newActivity: { totalActivity: number; totalMinutes: number }[];
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
    const newHourlyActivity = Array.from({ length: 24 }, () => ({
      totalActivity: 0,
      totalMinutes: 0,
    }));

    for (let hour = 0; hour < 24; hour++) {
      const inThisHour = selectedActivity.filter((d) => {
        const wibHour = new Date(
          new Date(d.created_at).getTime() + 7 * 60 * 60 * 1000,
        ).getUTCHours();
        return wibHour === hour;
      });

      hourlyActivity[hour] = inThisHour.length;
      newHourlyActivity[hour].totalActivity = inThisHour.length;
      newHourlyActivity[hour].totalMinutes = inThisHour.reduce(
        (acc, curr) => acc + (curr.interval ?? 0),
        0,
      );
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
