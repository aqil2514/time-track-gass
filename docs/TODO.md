# TODO - Refactor & Migrate

## 1. Migrasi Database (Supabase → PostgreSQL + Prisma)
- [x] Export schema dari Supabase lama (`pg_dump` via Docker postgres:17)
- [x] Export data dari Supabase lama
- [x] Import schema & data ke PostgreSQL server kantor (aapanel) via aapanel Import
- [x] Import schema & data ke Docker PostgreSQL lokal (development)
- [x] Install Prisma di `apps/server`: `npm install prisma @prisma/client`
- [x] Init Prisma: `npx prisma init` → buat `prisma/schema.prisma`
- [x] Definisikan semua model di `schema.prisma` sesuai tabel yang ada (`db pull`)
- [x] Jalankan `npx prisma generate`
- [x] Setup SSH tunnel ke PostgreSQL aapanel (port 5432)
- [ ] Ganti `.env`: hapus `SUPABASE_URL` & `SUPABASE_ANON_KEY`, tambah `DATABASE_URL` (PostgreSQL)
- [ ] Refactor semua Supabase client call → Prisma client
- [ ] Test koneksi & verifikasi semua fitur

## 2. Restructure Folder Server
- [ ] Diskusi & finalisasi struktur folder baru (acuan: retail-multitenant)
- [ ] Pindahkan file sesuai struktur baru
- [ ] Pastikan semua import path terupdate
- [ ] Test semua endpoint

## 3. Cleanup Branch
- [ ] Hapus `gitlab/dev` di remote GitLab
- [ ] Pertimbangkan hapus `origin/main` di GitHub
