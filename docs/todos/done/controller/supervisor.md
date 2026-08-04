# Supervisor Module - Todo

## Controller: `SupervisorController` (`/supervisor`)

- [x] GET /supervisor/user-activity
- [x] GET /supervisor/user-profile
- [x] GET /supervisor/user-daily-insight
- [x] GET /supervisor/user-daily-percategory
- [x] POST /supervisor/trigger/session-summary

## Controller: `SupervisorActivityController` (`/supervisor/activity`)

- [x] PATCH /supervisor/activity/delete
- [x] PATCH /supervisor/activity/category

## Controller: `SupervisorDivisionsController` (`/supervisor/division`)

- [x] GET /supervisor/division
- [x] POST /supervisor/division
- [x] PATCH /supervisor/division/:id
- [x] DELETE /supervisor/division/:id

## Controller: `SupervisorUserController` (`/supervisor/user`)

- [x] POST /supervisor/user
- [x] GET /supervisor/user
- [x] GET /supervisor/user/:id
- [x] PATCH /supervisor/user/:id
- [x] PATCH /supervisor/user/:id/reset-password
- [x] DELETE /supervisor/user/:id
- [x] GET /supervisor/user/:id/settings
- [x] PATCH /supervisor/user/:id/settings

## Controller: `SupervisorTrackerController` (`/supervisor/tracker`)

- [x] GET /supervisor/tracker
- [x] GET /supervisor/tracker/matrix
- [x] GET /supervisor/tracker/id/:id

## Controller: `AttendanceListnoteController` (`/supervisor/attendance/list-note`)

- [x] POST /supervisor/attendance/list-note
- [x] GET /supervisor/attendance/list-note
- [x] PATCH /supervisor/attendance/list-note/:listId
- [x] DELETE /supervisor/attendance/list-note/:listId

## Controller: `AttendanceProfileConfigController` (`/supervisor/attendance/profile-config`)

- [x] GET /supervisor/attendance/profile-config
- [x] PATCH /supervisor/attendance/profile-config/:userId

## Controller: `AttendanceSummaryController` (`/supervisor/attendance/summary`)

- [x] GET /supervisor/attendance/summary
- [x] GET /supervisor/attendance/summary/:userId

## Controller: `AttendanceAdjustmentController` (`/supervisor/attendance/adjustment`)

- [x] POST /supervisor/attendance/adjustment
- [x] GET /supervisor/attendance/adjustment
- [x] DELETE /supervisor/attendance/adjustment/:adjustmentId
- [x] PATCH /supervisor/attendance/adjustment/:adjustmentId
- [x] GET /supervisor/attendance/adjustment/:adjustmentId

## Processor

- [x] AttendanceLogsProcessor
