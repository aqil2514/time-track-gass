# Supervisor Module - Todo

## Controller: `SupervisorController` (`/supervisor`)

- [ ] GET /supervisor/user-activity
- [ ] GET /supervisor/user-profile
- [ ] GET /supervisor/user-daily-insight
- [ ] GET /supervisor/user-daily-percategory
- [ ] POST /supervisor/trigger/session-summary

## Controller: `SupervisorActivityController` (`/supervisor/activity`)

- [ ] PATCH /supervisor/activity/delete
- [ ] PATCH /supervisor/activity/category

## Controller: `SupervisorDivisionsController` (`/supervisor/division`)

- [ ] GET /supervisor/division
- [ ] POST /supervisor/division
- [ ] PATCH /supervisor/division/:id
- [ ] DELETE /supervisor/division/:id

## Controller: `SupervisorUserController` (`/supervisor/user`)

- [ ] POST /supervisor/user
- [ ] GET /supervisor/user
- [ ] GET /supervisor/user/:id
- [ ] PATCH /supervisor/user/:id
- [ ] PATCH /supervisor/user/:id/reset-password
- [ ] DELETE /supervisor/user/:id
- [ ] GET /supervisor/user/:id/settings
- [ ] PATCH /supervisor/user/:id/settings

## Controller: `SupervisorTrackerController` (`/supervisor/tracker`)

- [ ] GET /supervisor/tracker
- [ ] GET /supervisor/tracker/matrix
- [ ] GET /supervisor/tracker/id/:id

## Controller: `AttendanceListnoteController` (`/supervisor/attendance/list-note`)

- [ ] POST /supervisor/attendance/list-note
- [ ] GET /supervisor/attendance/list-note
- [ ] PATCH /supervisor/attendance/list-note/:listId
- [ ] DELETE /supervisor/attendance/list-note/:listId

## Controller: `AttendanceProfileConfigController` (`/supervisor/attendance/profile-config`)

- [ ] GET /supervisor/attendance/profile-config
- [ ] PATCH /supervisor/attendance/profile-config/:userId

## Controller: `AttendanceSummaryController` (`/supervisor/attendance/summary`)

- [ ] GET /supervisor/attendance/summary
- [ ] GET /supervisor/attendance/summary/:userId

## Controller: `AttendanceAdjustmentController` (`/supervisor/attendance/adjustment`)

- [ ] POST /supervisor/attendance/adjustment
- [ ] GET /supervisor/attendance/adjustment
- [ ] DELETE /supervisor/attendance/adjustment/:adjustmentId
- [ ] PATCH /supervisor/attendance/adjustment/:adjustmentId
- [ ] GET /supervisor/attendance/adjustment/:adjustmentId

## Processor

- [ ] AttendanceLogsProcessor
