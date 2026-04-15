export enum TableName {
  ActivityAdjusmentList = 'activity_adjustment_lists',
  ActivityAdjusments = 'activity_adjustments',
  AIScreenReport = 'ai_screen_report',
  AttendanceLogs = 'attendance_logs',
  Category = 'category',
  Divisions = 'divisions',
  Profiles = 'profiles',
  ProfileWorkConfigs = 'profile_work_configs',
  SessionSummary = 'session_summary',
  DailySummary = 'daily_summary',
  DailySummaryPerCategory = 'daily_summary_per_categories',
}

export enum RPCFunctionName {
  GET_SCREEN_REPORT_TODAY = 'get_screen_report_today',
  GET_SCREEN_REPORT_YESTERDAY = 'get_screen_report_yesterday',
  GET_USER_ALLOWED_CATEGORIES = 'get_user_allowed_categories',
  GET_WEEKLY_USER_ACTIVITY_BY_DATE = 'get_weekly_user_activity_by_date',
  GET_USER_SCREEN_REPORT_BY_DATE = 'get_user_screen_report_by_date',
  GET_USER_SCREEN_REPORT_WEEKLY = 'get_user_screen_report_weekly',
}
