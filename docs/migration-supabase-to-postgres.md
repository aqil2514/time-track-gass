# Migrasi Database: Supabase → PostgreSQL VPS

Tanggal: 2026-06-05

## Latar Belakang

Migrasi dari Supabase (managed PostgreSQL) ke self-hosted PostgreSQL di VPS sebagai bagian dari deploy `feature/fresh-start` ke production.

---

## Langkah-Langkah

### 1. Setup SSH Tunnel

PostgreSQL di VPS hanya bisa diakses dari dalam server (tidak expose ke publik). Akses dari lokal menggunakan SSH tunnel:

```bash
ssh -L 5433:127.0.0.1:5432 -i $env:USERPROFILE\.ssh\gitlab_ci_timetrack aqil@43.173.30.93 -N
```

Port 5433 digunakan (bukan 5432) karena PostgreSQL lokal sudah menempati port 5432.

`DATABASE_URL` di `.env` lokal disesuaikan ke port 5433:
```
DATABASE_URL="postgresql://timetrack:wbbejZHGmYWPtKPT@localhost:5433/timetrack"
```

---

### 2. Export dari Supabase

```bash
docker run --rm --network host postgres:17 pg_dump "postgresql://postgres:<password>@db.<project>.supabase.co:5432/postgres" --schema=public --no-owner --no-privileges > apps/server/prisma/backup.sql
```

---

### 3. Strip `\restrict` / `\unrestrict`

Supabase menambahkan `\restrict` dan `\unrestrict` di hasil pg_dump sebagai mekanisme keamanan — ini memblokir import ke PostgreSQL non-Supabase.

Buat `backup_clean.sql` dengan menghapus baris tersebut:

```powershell
(Get-Content "apps/server/prisma/backup.sql") | Where-Object { $_ -notmatch '^\restrict' -and $_ -notmatch '^\unrestrict' } | Set-Content "apps/server/prisma/backup_clean.sql"
```

---

### 4. Upload ke VPS

```bash
scp apps/server/prisma/backup_clean.sql aqil@43.173.30.93:/tmp/backup_clean.sql
```

---

### 5. Fix Permission di PostgreSQL

User `timetrack` tidak punya akses ke tabel:

```sql
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO timetrack;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO timetrack;
```

---

### 6. Fix pg_hba.conf

Server menggunakan `scram-sha-256` tapi pg_hba.conf dikonfigurasi `md5` untuk user `timetrack`, menyebabkan autentikasi gagal.

Edit `/www/server/pgsql/data/pg_hba.conf`:
```
# Sebelum
host timetrack timetrack 127.0.0.1/32 md5

# Sesudah
host timetrack timetrack 127.0.0.1/32 scram-sha-256
```

Reset password dan reload:
```sql
ALTER USER timetrack WITH PASSWORD 'wbbejZHGmYWPtKPT';
SELECT pg_reload_conf();
```

---

### 7. Import dengan Disable Foreign Key & RLS

Backup dari Supabase menginsert child table sebelum parent `profiles`, menyebabkan foreign key violation. Solusi: disable foreign key check sementara.

Jalankan di psql sebagai user `postgres` dalam satu sesi:

```sql
SET session_replication_role = replica;
```

Jika ada sisa data dari percobaan sebelumnya, truncate dulu:

```sql
TRUNCATE TABLE profiles, divisions, work_sessions, ai_screen_report,
  activity_adjustments, activity_adjustment_lists, attendance_logs,
  daily_summary, daily_summary_per_categories, profile_work_configs,
  session_summary, app_logs RESTART IDENTITY CASCADE;
```

Lalu import:

```bash
sudo -u postgres psql -d timetrack -h 127.0.0.1
```

```sql
SET session_replication_role = replica;
\i /tmp/backup_clean.sql
```

---

### 8. Fix Row Level Security (RLS)

Data berhasil masuk tapi tidak terlihat oleh user `timetrack` karena RLS aktif (diwarisi dari Supabase schema). Disable RLS di semua tabel:

```sql
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE divisions DISABLE ROW LEVEL SECURITY;
ALTER TABLE work_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE ai_screen_report DISABLE ROW LEVEL SECURITY;
ALTER TABLE activity_adjustments DISABLE ROW LEVEL SECURITY;
ALTER TABLE activity_adjustment_lists DISABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE daily_summary DISABLE ROW LEVEL SECURITY;
ALTER TABLE daily_summary_per_categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE profile_work_configs DISABLE ROW LEVEL SECURITY;
ALTER TABLE session_summary DISABLE ROW LEVEL SECURITY;
ALTER TABLE app_logs DISABLE ROW LEVEL SECURITY;
```

---

### 9. Verifikasi Data

```sql
SELECT 'profiles' as tabel, COUNT(*) FROM profiles
UNION ALL SELECT 'divisions', COUNT(*) FROM divisions
UNION ALL SELECT 'work_sessions', COUNT(*) FROM work_sessions
UNION ALL SELECT 'session_summary', COUNT(*) FROM session_summary
UNION ALL SELECT 'attendance_logs', COUNT(*) FROM attendance_logs
UNION ALL SELECT 'daily_summary', COUNT(*) FROM daily_summary
UNION ALL SELECT 'ai_screen_report', COUNT(*) FROM ai_screen_report
UNION ALL SELECT 'activity_adjustment_lists', COUNT(*) FROM activity_adjustment_lists
UNION ALL SELECT 'activity_adjustments', COUNT(*) FROM activity_adjustments
UNION ALL SELECT 'app_logs', COUNT(*) FROM app_logs
UNION ALL SELECT 'profile_work_configs', COUNT(*) FROM profile_work_configs
UNION ALL SELECT 'daily_summary_per_categories', COUNT(*) FROM daily_summary_per_categories;
```

Hasil akhir (2026-06-05):

| Tabel | Supabase | Production |
|-------|----------|------------|
| profiles | 16 | 16 ✅ |
| divisions | 8 | 8 ✅ |
| work_sessions | 801 | 793 ✅ |
| session_summary | 14,821 | 14,821 ✅ |
| attendance_logs | 646 | 646 ✅ |
| daily_summary | 558 | 558 ✅ |
| ai_screen_report | 40,666 | 40,666 ✅ |
| activity_adjustment_lists | 7 | 7 ✅ |
| activity_adjustments | 62 | 62 ✅ |
| app_logs | 13,951 | 13,828 ✅ |
| profile_work_configs | 14 | 14 ✅ |
| daily_summary_per_categories | 3,022 | 3,022 ✅ |

Selisih `work_sessions` (-8) dan `app_logs` (-123) wajar — data baru masuk ke Supabase setelah backup diambil.

---

## Catatan Penting

- `DATABASE_URL` di production VPS menggunakan port 5432 langsung (bukan 5433 — itu hanya untuk SSH tunnel dari lokal)
- RLS diwarisi dari schema Supabase, harus di-disable manual di self-hosted PostgreSQL
- `\restrict`/`\unrestrict` selalu muncul di pg_dump Supabase, harus dihapus sebelum import
