# Activities Endpoints

## Controller: `ActivitiesController` (`/activities`)

Guard: `JwtAuthGuard` (semua endpoint)

---

### GET /activities/user

Ambil daftar aktivitas pengguna berdasarkan tanggal. Data dikelompokkan per session summary beserta item AI screen report di dalamnya.

**Query Params:**
- `date` — tanggal (ISO string, e.g. `2024-01-15`)

**Response:** `ActivityData[]`

---

### GET /activities/total-work

Ambil rekapitulasi total jam kerja harian, mingguan, dan activity adjustment untuk minggu yang mencakup tanggal tersebut.

**Query Params:**
- `date` — tanggal (ISO string)

**Response:**
```json
{
  "dailySummaryTime": { "total_work_time_minutes": 480 },
  "weeklySummaryTime": { "total_work_time_minutes": 2400, "week_start": "...", "week_end": "..." },
  "activityAdjustment": [{ "affected_minutes": 30, "date": "...", "activity_adjustment_lists": { "name": "..." } }]
}
```

---

### GET /activities/daily

Ambil ringkasan harian (daily summary) pengguna untuk tanggal tertentu.

**Query Params:**
- `date` — tanggal (ISO string)

**Response:** `DailySummaryDb | undefined`

---

## Controller: `ActivitiesV2Controller` (`/activities/v2`)

Guard: `JwtAuthGuard`

---

### GET /activities/v2

Ambil semua data aktivitas sekaligus dalam satu request (gabungan daily activity, activity data, total work, dan work sessions). Semua query dijalankan paralel dengan `Promise.all`.

**Query Params:**
- `date` — tanggal (ISO string)

**Response:**
```json
{
  "dailyActivity": { ... },
  "activityData": [ ... ],
  "totalWork": { ... },
  "workSessions": [ ... ]
}
```

---

## Cron: `ActivitiesSummaryCronService`

### createNewSummary — `EVERY_HOUR` (disabled di development)

Tambahkan job ke queue `summary-session` untuk setiap user aktif. Diproses oleh `SummarySessionProcessor`.

### createDailySummary — `EVERY_DAY_AT_10PM` (Asia/Jakarta)

Tambahkan job ke queue `daily-summary` untuk setiap user. Diproses oleh `DailySummaryProcessor`.

### createDailySummaryPerCategory — `EVERY_DAY_AT_11PM` (Asia/Jakarta)

Tambahkan job ke queue `daily-category-summary` untuk setiap user. Diproses oleh `DailySummaryCategoryProcessor`.

---

## Cron: `ActivitiesReminderCronService`

### sendMorningBatchReminder — `0 11 * * *` (Asia/Jakarta)

Kirim pesan bulk reminder cek batch pagi.

### sendAfternoonBatchReminder — `0 15 * * *` (Asia/Jakarta)

Kirim pesan bulk reminder cek batch siang.

### sendFinalCheckReminder — `0 17 * * *` (Asia/Jakarta)

Kirim pesan bulk reminder final check.

---

## Cron: `ActivitiesAttendanceCronService`

### createNewTotalWorkTime — `EVERY_DAY_AT_1AM` (Asia/Jakarta)

Ambil data screen report kemarin, lalu upsert ke tabel `attendance_logs` sebagai rekapitulasi durasi kerja per user per hari.
