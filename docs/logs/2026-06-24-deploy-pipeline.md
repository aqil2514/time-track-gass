# Deploy Pipeline — 24 Juni 2026

## Apa yang dilakukan?

Mengaktifkan proses deploy otomatis (CI/CD) agar setiap kali ada perubahan kode yang di-push ke GitLab, server di VPS langsung diperbarui secara otomatis — termasuk menjalankan perubahan database (migrasi).

---

## Masalah yang Ditemui dan Solusinya

### 1. Prisma tidak bisa baca konfigurasi database
**Masalah:** Perintah migrasi gagal karena file konfigurasi Prisma (`prisma.config.ts`) tidak ikut dikirim ke VPS.  
**Solusi:** Tambahkan file tersebut ke daftar file yang dikirim saat deploy.

---

### 2. Prisma tidak tahu alamat database
**Masalah:** Prisma butuh `DATABASE_URL` (alamat koneksi ke database), tapi cara yang digunakan untuk membacanya dari file `.env` VPS tidak berhasil karena format file `.env` mengandung karakter khusus.  
**Solusi:** Biarkan Prisma membaca langsung dari file `.env` via `prisma.config.ts` yang sudah di-kirim ke VPS.

---

### 3. User database tidak punya izin untuk mengubah tabel
**Masalah:** Migrasi gagal karena user database `timetrack` bukan pemilik (owner) tabel `ai_screen_report`, sehingga tidak boleh mengubah strukturnya.  
**Solusi:** Masuk ke VPS, login ke PostgreSQL sebagai superuser, lalu jalankan:
```sql
ALTER TABLE ai_screen_report OWNER TO timetrack;
```

---

### 4. Migrasi sebelumnya tercatat gagal di database
**Masalah:** Karena error permission di atas, migrasi sempat berjalan sebagian dan dicatat sebagai "gagal" di database. Prisma menolak menjalankan migrasi baru sebelum masalah ini diselesaikan.  
**Solusi:** Tandai migrasi tersebut sebagai "dibatalkan" (rolled back) di VPS:
```bash
npx prisma migrate resolve --rolled-back '20260624012227_add_image_hash_to_ai_screen_report'
```

---

### 5. Migration mencoba menghapus index yang tidak ada di production
**Masalah:** File SQL migrasi berisi perintah `DROP INDEX` untuk sebuah index yang hanya ada di database lokal, tidak di production. Akibatnya migrasi gagal.  
**Solusi:** Hapus baris `DROP INDEX` dari file SQL migrasi, lalu tandai ulang sebagai rolled back di VPS, kemudian trigger pipeline lagi.

---

### 6. Baseline migration sudah tercatat dua kali
**Masalah:** Pipeline mencoba mencatat baseline migration sebagai "sudah dijalankan", padahal sudah tercatat dari percobaan sebelumnya.  
**Solusi:** Hapus perintah `prisma migrate resolve --applied` dari CI/CD karena hanya perlu dijalankan sekali.

---

## Hasil Akhir

- Pipeline CI/CD berjalan sukses
- Kolom `image_hash` berhasil ditambahkan ke tabel `ai_screen_report` di production
- Server di VPS otomatis restart setelah deploy
- Untuk deploy berikutnya: cukup push kode ke GitLab, semua berjalan otomatis
