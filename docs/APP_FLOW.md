# App Flow

Dokumen ini menjelaskan flow utama aplikasi berdasarkan struktur codebase saat ini. Secara arsitektur, repo ini terdiri dari tiga bagian:

- `apps/desktop/` — aplikasi worker berbasis Tauri + React
- `apps/server/` — backend API berbasis NestJS
- `apps/web/` — aplikasi supervisor/admin berbasis Next.js

## Gambaran umum

Alur end-to-end utamanya seperti ini:

1. Worker login dari aplikasi desktop.
2. Desktop menyimpan token akses secara lokal.
3. Worker membuka halaman home dan mengambil data aktivitas harian dari server.
4. Saat worker memulai sesi kerja, desktop menjalankan auto-capture screenshot.
5. Screenshot di-upload ke server.
6. Server memasukkan screenshot ke queue untuk diproses di background.
7. Hasil analisis masuk ke data aktivitas, summary, dan attendance.
8. Supervisor login melalui web app dan melihat data yang sudah diproses.

## 1. Flow aplikasi desktop

### 1.1 Entry point dan routing

Desktop app diinisialisasi dari `apps/desktop/src/main.tsx:12`.

Route utama yang terdaftar:

- `/`
- `/login`
- `/register`
- `/reset-password`

Saat startup, desktop juga melakukan pengecekan update aplikasi melalui integrasi Tauri updater di `apps/desktop/src/main.tsx:34`.

### 1.2 Flow autentikasi worker

Flow autentikasi worker berjalan seperti ini:

1. User login dari halaman `apps/desktop/src/routes/login/index.tsx:32`.
2. Desktop memanggil endpoint backend login.
3. Jika sukses, token disimpan ke Tauri Store lokal.
4. Hook auth membaca token lokal lalu memvalidasi user ke endpoint `auth/me` di `apps/desktop/src/hooks/use-auth.ts:28`.
5. Jika token tidak valid, token akan dihapus dan user dianggap logout.

Home page desktop bersifat protected secara client-side di `apps/desktop/src/routes/home/index.tsx:7`, sehingga user yang belum login akan diarahkan ke halaman login.

### 1.3 Flow halaman home worker

State utama halaman home dipusatkan di `apps/desktop/src/routes/home/store/home.provider.tsx:45`.

Saat halaman home dibuka:

1. Desktop mengambil data gabungan aktivitas harian berdasarkan tanggal.
2. Data ini berasal dari endpoint `activities/v2`.
3. Hasilnya dipakai untuk menampilkan ringkasan aktivitas, total work, dan work session hari itu.

Provider ini juga menangani logic auto-resume. Jika ditemukan work session yang masih aktif dan belum memiliki `end_at`, desktop akan mencoba melanjutkan auto-capture setelah aplikasi dibuka ulang di `apps/desktop/src/routes/home/store/home.provider.tsx:63`.

### 1.4 Flow start dan stop work session

Flow sesi kerja worker:

1. Worker menekan tombol start.
2. Desktop memanggil `POST /work-session/start` dari `apps/desktop/src/routes/home/components/controller/start-session.tsx:16`.
3. Jika sukses, desktop memulai auto-capture screenshot.
4. Saat worker menekan stop, desktop menghentikan capture lalu memanggil `POST /work-session/end` dari `apps/desktop/src/routes/home/components/controller/start-session.tsx:41`.

Di backend, endpoint sesi kerja didefinisikan di:

- `apps/server/src/app/work-session/work-session.controller.ts:9` — start
- `apps/server/src/app/work-session/work-session.controller.ts:15` — end

### 1.5 Flow auto-capture screenshot

Logic utama timer dan capture ada di `apps/desktop/src/routes/home/logic/use-home-timer-controller.ts:17`.

Flow-nya:

1. Saat auto-capture dimulai, desktop langsung mengambil screenshot pertama.
2. Setelah itu, desktop menjadwalkan capture berikutnya dengan countdown internal.
3. Screenshot diambil melalui hook `apps/desktop/src/hooks/use-capture.ts`.
4. Hasil screenshot di-upload ke backend melalui `POST /image-upload`.

Behavior capture per platform:

- **macOS**: cek permission screen recording lalu memanggil native command Tauri.
- **non-macOS**: mengambil screenshot monitor pertama lalu menjalankan proses resize/encode sebelum upload.

Upload screenshot dari desktop dilakukan di `apps/desktop/src/routes/home/logic/use-home-timer-controller.ts:84`.

### 1.6 Flow upload manual

Selain auto-capture, tersedia upload manual dari komponen `apps/desktop/src/routes/home/components/controller/upload-image/index.tsx:34`.

Flow upload manual:

1. Worker memilih slot waktu.
2. Desktop mengecek status slot ke backend.
3. Worker memilih file gambar.
4. Desktop mengirim multipart upload ke `POST /image-upload/manual`.
5. Backend memvalidasi file lalu memasukkan job ke queue manual analysis.

## 2. Flow backend server

### 2.1 Entry point server

Server NestJS dibootstrap dari `apps/server/src/main.ts:6`.

Saat startup, server mengaktifkan:

- JSON body limit
- global validation pipe
- cookie parser
- CORS untuk domain yang diizinkan, termasuk skema desktop app

Komposisi module utama ada di `apps/server/src/app/app.module.ts:9`.

### 2.2 Module utama

Registry module bisnis utama yang aktif mencakup:

- Auth
- Activities
- Supervisor
- Image Upload
- Log
- Work Session

Registrasi ini tersusun di `apps/server/src/app/app-registry/built-in-registry.ts:8`.

### 2.3 Flow endpoint `activities/v2`

Endpoint gabungan aktivitas harian ada di `apps/server/src/app/activities/controllers/activities-v2.controller.ts:5`.

Endpoint ini menggabungkan beberapa sumber data sekaligus, termasuk:

- daily activity
- activity data
- total work
- work sessions

Endpoint ini menjadi salah satu sumber data utama untuk halaman home worker di desktop.

### 2.4 Flow upload dan queue processing

Endpoint upload screenshot ada di `apps/server/src/app/image-upload/controller/image-upload.controller.ts:22`.

Flow backend untuk screenshot otomatis:

1. Desktop mengirim file screenshot ke endpoint upload.
2. Server menerima file dan metadata.
3. Server membuat job queue untuk proses analisis normal.
4. Worker queue memproses job tersebut di background.
5. Hasil analisis disimpan agar bisa tampil pada aktivitas dan dashboard.

Untuk upload manual, server juga melakukan validasi file lebih dulu. Jika file tidak valid, server mengembalikan error 422 beserta detail file.

### 2.5 Queue dan background jobs

Sistem queue memakai BullMQ/Redis dan diregistrasikan di `apps/server/src/app/app-registry/bull-registry.ts:8`.

Server juga memiliki background job terjadwal, terutama untuk:

- pembuatan summary session berkala
- pembuatan daily summary
- pembuatan summary per kategori
- materialisasi attendance total work

Logic cron utama ada di `apps/server/src/app/activities/services/activities-cron.service.ts:16`.

## 3. Flow aplikasi web supervisor

### 3.1 Entry point dan proteksi route

Web app menggunakan Next.js App Router.

- Root page ada di `apps/web/src/app/page.tsx:3`
- Protected layout ada di `apps/web/src/app/(protected)/layout.tsx:12`

Saat user membuka root page:

1. Aplikasi mengecek apakah supervisor sudah login.
2. Jika sudah login, user diarahkan ke dashboard.
3. Jika belum login, user diarahkan ke halaman login.

### 3.2 Flow autentikasi supervisor

Login supervisor tidak langsung dari browser ke backend. Flow-nya memakai proxy route internal Next.js:

1. Browser memanggil `POST /api/auth/login` di `apps/web/src/app/api/auth/login/route.ts:5`.
2. Route Next.js meneruskan request ke backend `auth/login/supervisor`.
3. Jika sukses, token disimpan sebagai cookie `access_token` httpOnly.
4. Saat render halaman protected, helper auth membaca cookie lalu memanggil backend untuk mendapatkan profil user.

Helper auth web ada di `apps/web/src/lib/auth.ts:5`.

### 3.3 Flow proxy API web

Web app menggunakan pola proxy server-side melalui `apps/web/src/lib/api-server.ts:6`.

Artinya flow request supervisor adalah:

1. Browser memanggil API route internal di Next.js.
2. Next.js meneruskan request ke backend NestJS.
3. Cookie auth diteruskan oleh layer server-side.
4. Response dari backend dikembalikan lagi ke browser.

Pendekatan ini membuat auth supervisor berbasis cookie lebih mudah dikelola di sisi web.

### 3.4 Flow dashboard supervisor

Dashboard page ada di `apps/web/src/app/(protected)/dashboard/page.tsx:7` dan dirender lewat template `apps/web/src/features/dashboard/dashboard.template.tsx:9`.

Flow dashboard:

1. Supervisor memilih filter user dan tanggal.
2. Provider dashboard mengambil data aktivitas melalui endpoint web internal.
3. Data tersebut ditampilkan sebagai ringkasan dashboard.

Provider dashboard ada di `apps/web/src/features/dashboard/provider/dashboard.provider.tsx:20`.

### 3.5 Flow moderasi aktivitas dan manajemen user

Supervisor dapat melakukan beberapa aksi administratif, seperti:

- melihat aktivitas user
- soft delete aktivitas
- bulk edit kategori aktivitas
- mengelola user/tim/divisi
- reset password user
- melihat dan mengelola attendance

Contoh controller terkait:

- `apps/server/src/app/supervisor/controllers/supervisor-activity.controller.ts:12`
- `apps/server/src/app/supervisor/controllers/supervisor-user.controller.ts:25`

## 4. Ringkasan flow end-to-end

### Flow worker

1. Login di desktop
2. Buka home
3. Ambil data aktivitas harian
4. Start work session
5. Auto-capture screenshot
6. Upload screenshot ke server
7. Stop work session saat selesai

### Flow server

1. Terima request auth, activity, upload, dan supervisor
2. Simpan dan proses data bisnis
3. Jalankan analisis screenshot melalui queue
4. Buat summary dan attendance lewat cron/background jobs

### Flow supervisor

1. Login via web
2. Masuk ke dashboard protected
3. Ambil data dari backend melalui Next.js API proxy
4. Lihat summary, aktivitas, attendance, dan data user
5. Lakukan aksi moderasi atau administrasi jika diperlukan

## 5. File referensi utama

### Desktop

- `apps/desktop/src/main.tsx:12`
- `apps/desktop/src/hooks/use-auth.ts:14`
- `apps/desktop/src/routes/home/store/home.provider.tsx:45`
- `apps/desktop/src/routes/home/logic/use-home-timer-controller.ts:17`
- `apps/desktop/src/hooks/use-capture.ts:39`

### Server

- `apps/server/src/main.ts:6`
- `apps/server/src/app/app.module.ts:9`
- `apps/server/src/app/activities/controllers/activities-v2.controller.ts:5`
- `apps/server/src/app/image-upload/controller/image-upload.controller.ts:22`
- `apps/server/src/app/work-session/work-session.controller.ts:5`
- `apps/server/src/app/activities/services/activities-cron.service.ts:16`

### Web

- `apps/web/src/app/page.tsx:3`
- `apps/web/src/app/(protected)/layout.tsx:12`
- `apps/web/src/app/api/auth/login/route.ts:5`
- `apps/web/src/lib/auth.ts:5`
- `apps/web/src/lib/api-server.ts:6`
- `apps/web/src/features/dashboard/dashboard.template.tsx:9`

## 6. Catatan penting

- Desktop worker memakai token bearer yang disimpan lokal.
- Web supervisor memakai cookie `httpOnly` melalui proxy Next.js.
- Screenshot tidak diproses sinkron saat upload, tetapi dimasukkan ke queue background.
- Summary dan attendance tidak hanya berasal dari request real-time, tetapi juga dibentuk oleh cron/background jobs.

---

Jika diperlukan, dokumen ini bisa dikembangkan lagi menjadi:

- sequence diagram per flow
- dokumentasi endpoint per domain
- penjelasan detail pipeline analisis screenshot
- peta module backend per bounded context
