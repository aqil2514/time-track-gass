import { AttendanceAdjustmentController } from '../controllers/attendance/attendance-adjustment.controller';
import { SupervisorAttendanceListNoteController } from '../controllers/attendance/attendance-listnote.controller';
import { AttendanceProfileConfigController } from '../controllers/attendance/attendance-profile-config.controller';
import { AttendanceSummaryController } from '../controllers/attendance/attendance-summary.controller';
import { SupervisorActivityController } from '../controllers/supervisor-activity.controller';
import { SupervisorDivisionsController } from '../controllers/supervisor-divisions.controller';
import { SupervisorTrackerController } from '../controllers/supervisor-tracker.controller';
import { SupervisorUserController } from '../controllers/supervisor-user.controller';
import { SupervisorController } from '../controllers/supervisor.controller';

export const SUPERVISOR_CONTROLLER = [
  SupervisorController,
  SupervisorUserController,
  SupervisorTrackerController,
  SupervisorDivisionsController,
  SupervisorActivityController,
];

export const ATTENDANCE_CONTROLLER = [
  SupervisorAttendanceListNoteController,
  AttendanceSummaryController,
  AttendanceProfileConfigController,
  AttendanceAdjustmentController,
];
