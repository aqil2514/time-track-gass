# Server

## Overview
Backend API untuk sistem time tracking, activity monitoring, attendance, dan supervisor tooling. Repo ini adalah pusat business logic: desktop dan web sama-sama bergantung pada server untuk auth, work session, activity summary, attendance, dan proses background.

## Responsibilities
- Auth untuk worker dan supervisor
- Work session start/stop
- Activity retrieval dan summary harian/per sesi
- Attendance summary, adjustment, list-note, dan profile config
- Upload image/screenshot dan analisis AI/OCR
- Background jobs dan cron processing
- Client log ingestion

## How it fits in the system
- [desktop/](../desktop/) memakai server sebagai API utama untuk worker/end-user.
- [web/](../web/) memakai server sebagai backend utama, biasanya lewat Next API proxy.
- Server menyimpan dan mengambil data dari Supabase, menjalankan queue di Redis/BullMQ, dan mengakses layanan eksternal seperti S3 dan provider AI.

## Local development
Install dependencies:

```bash
npm install
```

Run in development:

```bash
npm run start:dev
```

Build:

```bash
npm run build
```

Run production build locally:

```bash
npm run start:prod
```

Tests:

```bash
npm run test
npm run test:e2e
npm run test:cov
```

Default port berasal dari `PORT` dan fallback ke `3000`.

## Environment variables
Env berikut dipakai langsung oleh kode saat ini:

| Variable | Purpose |
| --- | --- |
| `PORT` | Port HTTP server |
| `NODE_ENV` | Runtime environment |
| `JWT_SECRET_KEY` | Signing key untuk JWT |
| `SUPABASE_URL` | URL project Supabase |
| `SUPABASE_SECRET_KEY` | Service key Supabase |
| `BULL_MQ_REDIS_HOST` | Host Redis untuk queue dan throttling |
| `BULL_MQ_REDIS_PORT` | Port Redis |
| `BULL_MQ_REDIS_PASSWORD` | Password Redis |
| `BULL_MQ_DASHBOARD_USERNAME` | Username basic auth Bull Board |
| `BULL_MQ_DASHBOARD_PASSWORD` | Password basic auth Bull Board |
| `BULL_SUMMARY_SESSION` | Nama queue summary session |
| `BULL_DAILY_SUMMARY_QUEUE` | Nama queue daily summary |
| `BULL_DAILY_CATEGORY_SUMMARY_QUEUE` | Nama queue daily per-category summary |
| `BULL_MANUAL_UPLOAD_QUEUE` | Nama queue manual image analyze |
| `BULL_MANUAL_SLOT_STATUS_QUEUE` | Nama queue manual slot status |
| `S3_ENDPOINT` | Endpoint object storage |
| `S3_ACCESS_KEY_ID` | Access key object storage |
| `S3_ACCES_SECRET_KEY` | Secret key object storage |
| `GEMINI_API_KEY` | API key Gemini |
| `Z_AI_API_KEY` | API key provider Zhipu/Z AI |
| `SERVICE_KONEKWA_ENDPOINT` | Endpoint service reminder/message |
| `SERVICE_KONEKWA_API_KEY` | API key service reminder/message |
| `SERVICE_KONEKWA_SESSION_ID` | Session identifier service reminder/message |
| `SERVICE_KONEKWA_NO_MBAK_NISA` | Target recipient untuk reminder tertentu |

## Key flows
### 1. User auth
- Worker login/register lewat controller auth.
- Supervisor login memakai endpoint khusus yang mengeluarkan cookie `access_token`.
- Password disimpan sebagai bcrypt hash.

Relevant files:
- [server/src/app/auth/auth.controller.ts](src/app/auth/auth.controller.ts)
- [server/src/app/auth/services/auth.service.ts](src/app/auth/services/auth.service.ts)
- [server/src/app/auth/services/auth-mapper.service.ts](src/app/auth/services/auth-mapper.service.ts)

### 2. Work session
- Worker memulai sesi lewat `POST /work-session/start`.
- Worker mengakhiri sesi lewat `POST /work-session/end`.
- Data sesi dipakai dalam summary dan attendance flow.

Relevant files:
- [server/src/app/work-session/work-session.controller.ts](src/app/work-session/work-session.controller.ts)
- [server/src/app/work-session/work-session.service.ts](src/app/work-session/work-session.service.ts)

### 3. Activities and summaries
- Endpoint user-level menyediakan activity data, total work, dan daily summary.
- Endpoint v2 menggabungkan beberapa ringkasan untuk kebutuhan client.
- Cron dan queue dipakai untuk summary per sesi, daily summary, per-category summary, dan attendance materialization.

Relevant files:
- [server/src/app/activities/controllers/activities.controller.ts](src/app/activities/controllers/activities.controller.ts)
- [server/src/app/activities/controllers/activities-v2.controller.ts](src/app/activities/controllers/activities-v2.controller.ts)
- [server/src/app/activities/services/activities-cron.service.ts](src/app/activities/services/activities-cron.service.ts)
- [server/src/app/activities/processor/](src/app/activities/processor/)

### 4. Supervisor and attendance
- Semua endpoint supervisor dilindungi guard JWT supervisor dan role guard.
- Area ini mencakup user management, division management, tracker/matrix, activity moderation, attendance summary, adjustment, dan list-note.

Relevant files:
- [server/src/app/supervisor/controllers/](src/app/supervisor/controllers/)
- [server/src/app/supervisor/controllers/attendance/](src/app/supervisor/controllers/attendance/)
- [server/src/app/supervisor/services/](src/app/supervisor/services/)

### 5. Image upload and AI analysis
- Worker dapat upload image biasa atau manual slot-based upload.
- Analisis dijalankan dengan queue dan memanfaatkan OCR/AI helpers.

Relevant files:
- [server/src/app/image-upload/](src/app/image-upload/)
- [server/src/services/ai-gemini/](src/services/ai-gemini/)
- [server/src/services/ai-z/](src/services/ai-z/)
- [server/src/services/aws-s3/](src/services/aws-s3/)

## Important paths
- [server/src/main.ts](src/main.ts) — bootstrap, CORS, validation, cookie parser
- [server/src/app/app.module.ts](src/app/app.module.ts) — root composition
- [server/src/app/app-registry/](src/app/app-registry/) — registries untuk config, built-in modules, third-party modules, queues, throttling
- [server/src/app/auth/](src/app/auth/) — auth dan settings user
- [server/src/app/work-session/](src/app/work-session/) — lifecycle work session
- [server/src/app/activities/](src/app/activities/) — activity APIs, summary logic, cron, processors
- [server/src/app/supervisor/](src/app/supervisor/) — admin/supervisor domain
- [server/src/app/image-upload/](src/app/image-upload/) — upload + analyze flow
- [server/src/services/](src/services/) — integrasi Supabase, S3, AI, analyzer, dll

## Known caveats
- CORS allowlist di-bootstrap manual di [server/src/main.ts](src/main.ts), jadi origin baru perlu ditambahkan secara eksplisit.
- Supervisor auth bergantung pada cookie `access_token`, sedangkan desktop/worker flow memakai bearer token.
- Queue, throttling, dan beberapa cron flow bergantung pada Redis yang sama.
- Bull Board tersedia di `/queue` dan dilindungi basic auth.
- README ini tidak memuat contoh credential atau secret; gunakan env lokal Anda sendiri.
