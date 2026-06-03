# Work Session Endpoints

## Controller (`/work-session`)

### POST /work-session/start
Memulai sesi kerja baru untuk user yang sedang login. Jika sesi aktif sudah ada, request diabaikan dan warning dicatat ke log.
- **Guard:** JwtAuthGuard
- **Response:** `{ success: true }`

### POST /work-session/end
Mengakhiri sesi kerja aktif milik user dengan mode `manual`. Jika tidak ada sesi aktif, request diabaikan dan warning dicatat ke log.
- **Guard:** JwtAuthGuard
- **Response:** `{ success: true }`

---

## Cron

### checkAndStopSession — setiap 5 menit
Mengecek semua sesi kerja yang masih aktif (`end_at = null`). Untuk setiap sesi, mengambil timestamp aktivitas terakhir user dari `ai_screen_report`. Jika user tidak aktif lebih dari 15 menit, sesi otomatis diakhiri dengan mode `auto` menggunakan waktu aktivitas terakhir sebagai `end_at`.
