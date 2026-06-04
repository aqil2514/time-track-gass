# Manual Testing Checklist
> Branch: `refactor/migrate-restructure`
> Tujuan: Verifikasi semua fitur berjalan setelah migrasi Supabase → Prisma dan restructure folder

---

## Desktop App

### Auth
- [x] Login dengan email/username dan password yang valid
- [x] Login dengan kredensial salah → tampil error
- [x] Register user baru
- [x] Check reset password (cek apakah user perlu reset)
- [x] Set reset password baru
- [x] GET `/auth/me` → data user tampil di header/profil
- [x] GET `/auth/setting` → setting user termuat
- [x] PATCH `/auth/setting/tracker` → toggle mode tracker berhasil tersimpan

### Work Session
- [x] Start session → session tercatat di DB
- [x] End session → session berakhir dan tersimpan

### Image Upload & Log
- [x] Screenshot terkirim via `POST /image-upload` saat timer berjalan
- [x] Log aktivitas terkirim via `POST /log`

---

## Web App

### Auth
- [x] Login supervisor → redirect ke dashboard
- [x] Login dengan kredensial salah → tampil error
- [x] Logout → redirect ke halaman login
- [x] GET `/auth/me/supervisor` → data supervisor termuat

### User Management (`/supervisor/user`)
- [x] GET → daftar user tampil
- [x] POST → tambah user baru berhasil
- [x] PATCH → edit user berhasil
- [x] DELETE → hapus user berhasil
- [x] PATCH reset-password → flag reset password tersimpan
- [x] GET/PATCH settings → setting tracker user tampil dan bisa diedit

### Activity & Tracker
- [x] GET `/supervisor/user-activity` → data aktivitas user tampil per tanggal
- [x] PATCH bulk category → kategori aktivitas berubah
- [x] PATCH bulk delete → aktivitas terhapus
- [x] GET `/supervisor/tracker` → list aktivitas tracker tampil
- [x] GET `/supervisor/tracker/id/:id` → detail aktivitas + image tampil
- [x] GET `/supervisor/tracker/matrix` → matrix per jam tampil dengan data yang benar

### Dashboard
- [x] GET `/supervisor/user-daily-insight` → insight harian tampil
- [x] GET `/supervisor/user-daily-percategory` → breakdown per kategori tampil
- [x] GET `/supervisor/user-profile` → daftar profil user tampil

### Trigger
- [x] POST `/supervisor/trigger/session-summary` → job masuk ke queue tanpa error

### Divisions
- [x] GET → daftar divisi tampil
- [x] POST → tambah divisi baru berhasil
- [x] PATCH → edit divisi berhasil
- [x] DELETE → hapus divisi berhasil

### Attendance
- [x] GET summary → data summary absensi tampil
- [x] GET summary by user-id → data absensi per user tampil
- [x] GET profile-config → konfigurasi absensi user tampil
- [x] PATCH profile-config → update konfigurasi berhasil
- [x] GET list-note → daftar catatan tampil
- [x] POST list-note → tambah catatan berhasil
- [x] PATCH list-note → edit catatan berhasil
- [x] DELETE list-note → hapus catatan berhasil
- [x] GET adjustment → daftar penyesuaian tampil
- [x] POST adjustment → tambah penyesuaian berhasil
- [x] PATCH adjustment → edit penyesuaian berhasil
- [x] DELETE adjustment → hapus penyesuaian berhasil
