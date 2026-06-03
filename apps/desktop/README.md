# Desktop

## Overview
Aplikasi desktop worker/end-user berbasis Tauri + React untuk login, register, memulai atau mengakhiri work session, upload screenshot, dan melihat ringkasan aktivitas pribadi. Repo ini adalah client harian yang berinteraksi langsung dengan backend server.

## Responsibilities
- Login dan register user worker
- Menyimpan token auth lokal
- Menjalankan work session start/stop
- Auto capture / manual upload screenshot
- Menampilkan total work, timeline, daily insight, dan summary lain untuk user aktif
- Menangani integrasi Tauri seperti updater, HTTP adapter, dialog, dan permission terkait screenshot

## How it fits in the system
- [server/](../server/) adalah backend utama yang menerima auth, work session, image upload, dan activity fetch.
- [web/](../web/) dipakai supervisor/admin untuk memantau hasil aktivitas yang dikirim dari desktop.
- Desktop difokuskan ke worker/end-user, bukan ke administrasi tim.

## Local development
Install dependencies:

```bash
npm install
```

Run in development:

```bash
npm run dev
```

Build frontend:

```bash
npm run build
```

Tauri CLI entry:

```bash
npm run tauri
```

## Environment variables
| Variable | Purpose |
| --- | --- |
| `VITE_API_URL` | Base URL backend server |

## Key flows
### 1. Auth
- User login ke backend `auth/login`.
- Token disimpan di Tauri Store `auth.json`.
- Request berikutnya memakai `Authorization: Bearer <token>`.

Relevant files:
- [desktop/src/routes/login/index.tsx](src/routes/login/index.tsx)
- [desktop/src/routes/register/index.tsx](src/routes/register/index.tsx)
- [desktop/src/hooks/use-auth.ts](src/hooks/use-auth.ts)
- [desktop/src/lib/fetcher.ts](src/lib/fetcher.ts)
- [desktop/src/utils/get-token.ts](src/utils/get-token.ts)

### 2. Registration
- User register lewat form desktop.
- Division options diambil dari backend `auth/divisions`.

Relevant files:
- [desktop/src/routes/register/index.tsx](src/routes/register/index.tsx)
- [desktop/src/routes/register/division-form.tsx](src/routes/register/division-form.tsx)

### 3. Work session and capture
- Pada mode tracker tertentu, user dapat start/stop work session.
- Selama sesi aktif, desktop dapat menangkap screenshot dan mengirimkannya ke backend.
- Flow stop session juga berinteraksi dengan endpoint work-session.

Relevant files:
- [desktop/src/routes/home/components/controller/start-session.tsx](src/routes/home/components/controller/start-session.tsx)
- [desktop/src/routes/home/logic/use-home-timer-controller.ts](src/routes/home/logic/use-home-timer-controller.ts)
- [desktop/src/hooks/use-capture.ts](src/hooks/use-capture.ts)

### 4. Manual upload
- Jika worker memakai mode manual, user memilih slot/jam lalu upload image ke backend manual upload flow.
- UI juga mengecek status slot yang sedang diproses.

Relevant files:
- [desktop/src/routes/home/components/controller/upload-image/](src/routes/home/components/controller/upload-image/)
- [desktop/src/routes/home/schema/upload-image.schema.ts](src/routes/home/schema/upload-image.schema.ts)

### 5. Personal activity dashboard
Home route menyatukan komponen controller dan data summary untuk user aktif.

Relevant files:
- [desktop/src/routes/home/index.tsx](src/routes/home/index.tsx)
- [desktop/src/routes/home/components/home.template.tsx](src/routes/home/components/home.template.tsx)
- [desktop/src/routes/home/components/data/](src/routes/home/components/data/)
- [desktop/src/routes/home/components/controller/total-work/](src/routes/home/components/controller/total-work/)

## Important paths
- [desktop/src/main.tsx](src/main.tsx) — route setup dan update check saat startup
- [desktop/src/lib/api.ts](src/lib/api.ts) — axios client dengan adapter Tauri HTTP
- [desktop/src/lib/fetcher.ts](src/lib/fetcher.ts) — fetcher untuk request bearer-token
- [desktop/src/hooks/use-auth.ts](src/hooks/use-auth.ts) — auth gate dan logout flow
- [desktop/src/routes/login/](src/routes/login/) — login UI
- [desktop/src/routes/register/](src/routes/register/) — register UI
- [desktop/src/routes/home/](src/routes/home/) — main worker dashboard
- [desktop/src/components/](src/components/) — shared UI/forms/layout
- [desktop/src/utils/write-log-to-db.ts](src/utils/write-log-to-db.ts) — error logging helper

## Known caveats
- Desktop bergantung pada fitur Tauri dan izin OS; masalah screenshot atau permission biasanya tidak terlihat jika hanya diuji sebagai web app biasa.
- Token auth disimpan lokal di Tauri Store, jadi masalah session sering terkait penyimpanan lokal atau token kadaluwarsa.
- Update check dijalankan saat startup dari [desktop/src/main.tsx](src/main.tsx).
- Auto capture dan upload flow sensitif terhadap network, permission, dan backend rate limiting.
- README ini menggantikan template Tauri umum dengan konteks produk yang lebih relevan.
