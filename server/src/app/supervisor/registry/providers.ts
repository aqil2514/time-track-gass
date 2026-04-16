import { ProfileListenerHelper } from '../listeners/helpers/profile.listener-helper';
import { ProfileListenerEvent } from '../listeners/profile.listener';
import { AttendanceLogsProcessor } from '../processors/attendance-logs.processor';
import { AttendanceListnoteService } from '../services/attendance/attendance-listnote.service';
import { AttendanceProfileConfigService } from '../services/attendance/attendance-profile-config.service';
import { AttendanceSummaryService } from '../services/attendance/attendance-summary.service';
import { AttendanceSummaryMapper } from '../services/attendance/helpers/attedance-summary-mapper.service';
import { AttendanceSummaryHelper } from '../services/attendance/helpers/attendance-summary-helper.service';
import { SupervisorActivityFetcher } from '../services/helpers/supervisor-activity-fetcher.service';
import { SupervisorActivityMapper } from '../services/helpers/supervisor-activity-mapper.service';
import { SupervisorDivisionHelperService } from '../services/helpers/supervisor-division-helper.service';
import { SupervisorMatrixService } from '../services/helpers/supervisor-matrix.service';
import { SupervisorUserHelper } from '../services/helpers/supervisor-user-helper.service';
import { SupervisorACtivityService } from '../services/supervisor-activity.service';
import { SupervisorDivisionsService } from '../services/supervisor-division.service';
import { SupervisorTrackerService } from '../services/supervisor-tracker.service';
import { SupervisorUserService } from '../services/supervisor-user.service';
import { SupervisorService } from '../services/supervisor.service';

export const MIX_SUPERVISOR_SERVICES = [
  SupervisorService,
  SupervisorUserService,
  SupervisorTrackerService,
  SupervisorDivisionsService,
  SupervisorACtivityService,
];

export const MIX_SUPERVISOR_HELPER = [
  SupervisorUserHelper,
  SupervisorMatrixService,
  SupervisorActivityFetcher,
  SupervisorActivityMapper,
  SupervisorDivisionHelperService,
];

export const ATTENDANCE_SERVICES = [
  AttendanceListnoteService,
  AttendanceProfileConfigService,
  AttendanceSummaryService,
  AttendanceSummaryHelper,
  AttendanceSummaryMapper,
  AttendanceLogsProcessor,
];

export const PROFILE_LISTENER = [ProfileListenerEvent, ProfileListenerHelper];
