# Web

## Overview
Aplikasi web supervisor/admin berbasis Next.js untuk memantau aktivitas user, attendance, matrix, tim, dan divisi. Repo ini berfokus pada dashboard operasional dan memakai server backend sebagai sumber business logic utama.

## Responsibilities
- Login supervisor
- Protected dashboard pages untuk monitoring dan administrasi
- Next API routes sebagai proxy ke backend server
- Menampilkan data activity, attendance, teams, divisions, dan matrix
- Menjalankan aksi admin seperti reset password, bulk update activity, atau trigger summary

## How it fits in the system
- [server/](../server/) tetap menjadi sumber data dan business rules.
- Web bertugas menyajikan UI supervisor/admin dan meneruskan request ke backend.
- [desktop/](../desktop/) dipakai worker/end-user; data yang dikirim desktop kemudian dimonitor dari web.

## Local development
Install dependencies:

```bash
npm install
```

Run in development:

```bash
npm run dev
```

Build:

```bash
npm run build
```

Run production build locally:

```bash
npm run start
```

Lint:

```bash
npm run lint
```

Default dev port di script saat ini adalah `3001`.

## Environment variables
| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SERVER_URL` | Base URL backend server |
| `NEXT_PUBLIC_WEB_URL` | Public URL web app, dipakai untuk redirect/logout flow |

## Key flows
### 1. Supervisor auth
- Form login memanggil Next API route internal.
- Route itu meneruskan request ke backend `auth/login/supervisor`.
- Token disimpan sebagai cookie `access_token` dan dipakai untuk protected pages.

Relevant files:
- [web/src/app/api/auth/login/route.ts](src/app/api/auth/login/route.ts)
- [web/src/lib/auth.ts](src/lib/auth.ts)
- [web/src/app/(protected)/layout.tsx](src/app/(protected)/layout.tsx)
- [web/src/app/api/auth/logout/route.ts](src/app/api/auth/logout/route.ts)

### 2. Protected dashboard
Area utama supervisor ada di route berikut:
- [web/src/app/(protected)/dashboard/page.tsx](src/app/(protected)/dashboard/page.tsx)
- [web/src/app/(protected)/activity/page.tsx](src/app/(protected)/activity/page.tsx)
- [web/src/app/(protected)/matrix/page.tsx](src/app/(protected)/matrix/page.tsx)
- [web/src/app/(protected)/attendance/page.tsx](src/app/(protected)/attendance/page.tsx)
- [web/src/app/(protected)/teams/page.tsx](src/app/(protected)/teams/page.tsx)
- [web/src/app/(protected)/divisions/page.tsx](src/app/(protected)/divisions/page.tsx)

Sidebar structure:
- [web/src/components/layouts/dashboard-sidebar/items.tsx](src/components/layouts/dashboard-sidebar/items.tsx)

### 3. Next API proxy pattern
Sebagian besar browser-side code tidak langsung memanggil backend. Pola yang dipakai adalah:
1. komponen UI memanggil `/api/...` di Next
2. route handler Next meneruskan request ke server backend
3. auth cookie dilampirkan dari sisi server Next

Relevant files:
- [web/src/lib/api.ts](src/lib/api.ts)
- [web/src/lib/api-server.ts](src/lib/api-server.ts)
- [web/src/app/api/](src/app/api/)

### 4. Operational features
Fitur utama yang tersedia dari web:
- **Dashboard**: summary, insight, trigger session summary
- **Activity**: lihat activity per user/tanggal, bulk delete, bulk edit category
- **Matrix**: tampilan matrix/tracker activity
- **Attendance**: summary, adjustment, list-note, profile config
- **Teams**: CRUD user, reset password, user settings
- **Divisions**: CRUD division

Feature folders:
- [web/src/features/dashboard/](src/features/dashboard/)
- [web/src/features/activity/](src/features/activity/)
- [web/src/features/matrix/](src/features/matrix/)
- [web/src/features/attendance/](src/features/attendance/)
- [web/src/features/teams/](src/features/teams/)
- [web/src/features/divisions/](src/features/divisions/)

## Important paths
- [web/src/app/layout.tsx](src/app/layout.tsx) — root app shell
- [web/src/app/page.tsx](src/app/page.tsx) — root routing decision
- [web/src/app/login/page.tsx](src/app/login/page.tsx) — supervisor login page
- [web/src/app/(protected)/](src/app/(protected)/) — protected pages
- [web/src/app/api/](src/app/api/) — Next route handlers / backend proxy layer
- [web/src/lib/auth.ts](src/lib/auth.ts) — get current supervisor from cookie-backed session
- [web/src/lib/api-server.ts](src/lib/api-server.ts) — axios proxy client yang menyisipkan cookie
- [web/src/components/](src/components/) — shared UI/layout/forms
- [web/src/features/](src/features/) — feature-level templates dan dialogs

## Known caveats
- Business logic utama tetap ada di backend; web sebaiknya dianggap sebagai UI + proxy layer.
- Supervisor auth bergantung pada cookie `access_token`, jadi perubahan flow auth perlu dicek di Next route handlers dan backend sekaligus.
- Karena memakai Next API proxy, bug bisa muncul di dua lapis: browser → Next route, atau Next route → backend.
- README ini sengaja fokus pada struktur produk, bukan dokumentasi framework Next.js umum.
