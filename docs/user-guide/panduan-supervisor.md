# Panduan Penggunaan — Supervisor

Dokumen ini ditujukan untuk **supervisor** yang menggunakan aplikasi web untuk memantau dan mengelola aktivitas kerja tim.

---

## Apa itu aplikasi ini?

Aplikasi web supervisor adalah dasbor untuk memantau aktivitas harian karyawan, mengelola data user, melihat laporan absensi, dan melakukan moderasi aktivitas yang tercatat oleh sistem.

---

## 1. Login

1. Buka aplikasi web supervisor di browser.
2. Masukkan **email atau username** dan **password** akun supervisor.
3. Klik **Login**.
4. Jika berhasil, kamu akan diarahkan ke halaman **Dashboard**.

---

## 2. Dashboard

Dashboard adalah halaman utama yang menampilkan ringkasan aktivitas tim.

- **Filter user** — pilih karyawan tertentu untuk melihat datanya
- **Filter tanggal** — pilih tanggal yang ingin dilihat
- **Ringkasan harian** — total waktu kerja dan breakdown per kategori aktivitas
- **Insight harian** — gambaran produktivitas dan distribusi aktivitas

---

## 3. Melihat Aktivitas Karyawan

1. Buka menu **Aktivitas** atau **Activity**.
2. Pilih nama karyawan dari daftar.
3. Pilih tanggal yang ingin dilihat.
4. Sistem akan menampilkan:
   - Daftar aktivitas per sesi kerja
   - Nama aplikasi dan judul jendela yang digunakan
   - Kategori aktivitas
   - Screenshot terkait (jika tersedia)

### Melihat Detail Tracker

Untuk melihat detail lengkap termasuk gambar screenshot:

1. Buka menu **Tracker**.
2. Cari aktivitas yang ingin dilihat.
3. Klik pada aktivitas tersebut untuk membuka detailnya.
4. Tersedia juga tampilan **Matrix** untuk melihat distribusi aktivitas per jam.

---

## 4. Moderasi Aktivitas

Supervisor dapat mengedit atau menghapus aktivitas yang tidak sesuai.

### Mengubah Kategori Aktivitas (Bulk)

1. Di halaman aktivitas, centang aktivitas yang ingin diubah.
2. Pilih opsi **Bulk Edit Kategori**.
3. Pilih kategori baru.
4. Konfirmasi perubahan.

### Menghapus Aktivitas (Bulk)

1. Centang aktivitas yang ingin dihapus.
2. Pilih opsi **Bulk Delete**.
3. Konfirmasi penghapusan.

> Penghapusan aktivitas bersifat soft delete — data tidak langsung hilang dari sistem.

---

## 5. Manajemen User

Buka menu **User Management** untuk mengelola akun karyawan.

### Melihat Daftar User

- Halaman ini menampilkan seluruh karyawan yang terdaftar beserta informasi dasarnya.

### Menambah User Baru

1. Klik tombol **Tambah User**.
2. Isi formulir (nama, email, username, divisi, dll).
3. Klik **Simpan**.

### Mengedit User

1. Klik ikon edit pada baris user yang ingin diubah.
2. Ubah data yang diperlukan.
3. Klik **Simpan**.

### Menghapus User

1. Klik ikon hapus pada baris user yang ingin dihapus.
2. Konfirmasi penghapusan.

### Reset Password User

1. Temukan user di daftar.
2. Klik opsi **Reset Password**.
3. Sistem akan mengosongkan password user tersebut, sehingga user perlu mengatur password baru melalui fitur reset di aplikasi desktop.

### Mengubah Pengaturan Tracker User

1. Klik opsi **Settings** pada baris user.
2. Ubah mode tracker (Auto/Manual).
3. Simpan perubahan.

---

## 6. Manajemen Divisi

Buka menu **Divisi** untuk mengelola struktur organisasi.

- **Lihat daftar divisi** — tampil semua divisi yang ada
- **Tambah divisi** — buat divisi baru
- **Edit divisi** — ubah nama atau detail divisi
- **Hapus divisi** — hapus divisi yang tidak aktif

---

## 7. Absensi (Attendance)

Buka menu **Attendance** untuk melihat dan mengelola rekap kehadiran karyawan.

### Melihat Ringkasan Absensi

- Tampil rekapitulasi kehadiran seluruh karyawan
- Bisa difilter per user untuk melihat histori individu

### Konfigurasi Absensi per User

1. Pilih user dari daftar.
2. Buka **Profile Config**.
3. Atur konfigurasi absensi (jam kerja, dll).
4. Simpan.

### Catatan Absensi

Supervisor dapat menambahkan, mengedit, atau menghapus catatan absensi manual:

1. Buka bagian **Catatan** di halaman Attendance.
2. Gunakan tombol tambah/edit/hapus sesuai kebutuhan.

### Penyesuaian Waktu (Adjustment)

Jika ada koreksi waktu kerja yang perlu dilakukan:

1. Buka bagian **Adjustment**.
2. Tambahkan penyesuaian dengan durasi dan tanggal yang sesuai.
3. Simpan.

---

## 8. Logout

1. Klik nama akunmu di pojok kanan atas (atau menu profil).
2. Klik **Logout**.
3. Kamu akan diarahkan kembali ke halaman login.

---

## Pertanyaan Umum

**Data aktivitas karyawan diperbarui seberapa sering?**
Data dari screenshot diproses dalam hitungan detik hingga menit setelah screenshot diterima server. Ringkasan harian (daily summary) diperbarui setiap malam secara otomatis.

**Apakah saya bisa melihat screenshot yang diambil?**
Ya, melalui menu Tracker → Detail aktivitas, screenshot terkait bisa ditampilkan.

**Apa yang terjadi jika karyawan lupa menekan Stop?**
Sistem akan otomatis menghentikan sesi jika karyawan tidak aktif lebih dari 15 menit. Waktu berhenti akan menggunakan waktu aktivitas terakhir yang terdeteksi.

**Bisakah saya melihat aktivitas untuk beberapa hari sekaligus?**
Saat ini filter tanggal bekerja per hari. Gunakan halaman Attendance untuk melihat rekap mingguan/bulanan.
