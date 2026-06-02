# TODO - Refactor & Migrate

## 1. Migrasi Database
- [ ] Buat Supabase project baru (kantor)
- [ ] Export schema + data dari Supabase lama
- [ ] Import ke Supabase baru
- [ ] Ganti `.env` (URL + keys baru)
- [ ] Test koneksi & verifikasi fitur

## 2. Restructure Folder Server
- [ ] Diskusi & finalisasi struktur folder baru (acuan: retail-multitenant)
- [ ] Pindahkan file sesuai struktur baru
- [ ] Pastikan semua import path terupdate
- [ ] Test semua endpoint

## 3. Cleanup Branch
- [ ] Hapus `gitlab/dev` di remote GitLab
- [ ] Pertimbangkan hapus `origin/main` di GitHub
