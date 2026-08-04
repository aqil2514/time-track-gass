# Activities Module - Todo

## Controller: `ActivitiesController` (`/activities`)

- [x] GET /activities/user
- [x] GET /activities/total-work
- [x] GET /activities/daily

## Controller: `ActivitiesV2Controller` (`/activities/v2`)

- [x] GET /activities/v2

## Cron: `ActivitiesSummaryCronService`

- [x] createNewSummary — `EVERY_HOUR` (disabled di development)
- [x] createDailySummary — `EVERY_DAY_AT_10PM`
- [x] createDailySummaryPerCategory — `EVERY_DAY_AT_11PM`

## Cron: `ActivitiesReminderCronService`

- [x] sendMorningBatchReminder — `0 11 * * *`
- [x] sendAfternoonBatchReminder — `0 15 * * *`
- [x] sendFinalCheckReminder — `0 17 * * *`

## Cron: `ActivitiesAttendanceCronService`

- [x] createNewTotalWorkTime — `EVERY_DAY_AT_1AM`

## Processor

- [x] DailySummaryProcessor
- [x] DailySummaryCategoryProcessor
- [x] SummarySessionProcessor
