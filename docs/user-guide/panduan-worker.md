# Panduan Penggunaan — Worker

Dokumen ini ditujukan untuk **karyawan (worker)** yang menggunakan aplikasi desktop untuk mencatat aktivitas kerja harian.

---

## Apa itu aplikasi ini?

Aplikasi desktop ini adalah alat pencatat waktu kerja otomatis. Selama kamu bekerja, aplikasi akan mengambil screenshot layar secara berkala dan menganalisisnya untuk menghasilkan laporan aktivitas harian.

---

## 1. Registrasi Akun

Jika belum memiliki akun, kamu perlu mendaftar terlebih dahulu.

1. Buka aplikasi desktop.
2. Pada halaman awal, pilih **Register**.
3. Isi formulir registrasi:
   - Nama lengkap
   - Username
   - Email
   - Password
   - Divisi
4. Klik **Daftar**.
5. Jika berhasil, kamu akan diarahkan ke halaman login.

> Pastikan email dan username belum digunakan oleh akun lain.

---

## 2. Login

1. Buka aplikasi desktop.
2. Masukkan **email atau username** dan **password**.
3. Klik **Login**.
4. Jika berhasil, kamu akan masuk ke halaman utama (Home).

---

## 3. Lupa Password

Jika kamu lupa password:

1. Di halaman login, klik **Lupa Password**.
2. Masukkan email atau username akunmu.
3. Jika data ditemukan, kamu bisa memasukkan password baru.
4. Klik **Simpan**.

> Reset password pada aplikasi ini dilakukan secara internal — tidak ada email konfirmasi yang dikirim.

---

## 4. Halaman Utama (Home)

Setelah login, kamu akan melihat halaman utama yang berisi:

- **Ringkasan aktivitas hari ini** — daftar aktivitas yang sudah tercatat
- **Total waktu kerja** — akumulasi durasi kerja harian dan mingguan
- **Tombol Start/Stop** — untuk memulai dan mengakhiri sesi kerja

---

## 5. Memulai Sesi Kerja

1. Di halaman Home, klik tombol **Start**.
2. Aplikasi akan mulai merekam sesi kerjamu.
3. Secara otomatis, aplikasi akan langsung mengambil screenshot pertama.
4. Setelah itu, screenshot akan diambil secara berkala sesuai interval yang dikonfigurasi.

> Screenshot yang diambil akan dianalisis oleh sistem untuk mengenali aktivitas yang sedang kamu lakukan.

---

## 6. Mengakhiri Sesi Kerja

1. Saat selesai bekerja, klik tombol **Stop**.
2. Sesi kerja kamu akan dicatat dan ditutup.
3. Data aktivitas akan diperbarui di halaman Home.

> Jika kamu tidak aktif lebih dari **15 menit**, sistem akan otomatis menghentikan sesi kerjamu.

---

## 7. Upload Screenshot Manual

Selain screenshot otomatis, kamu bisa mengunggah screenshot secara manual untuk mengisi slot waktu tertentu yang belum tercatat.

1. Di halaman Home, cari opsi **Upload Manual**.
2. Pilih slot waktu yang ingin diisi.
3. Pilih file gambar dari perangkatmu.
4. Klik **Upload**.

> Upload manual berguna jika ada aktivitas yang terlewat karena koneksi atau gangguan teknis.

---

## 8. Melihat Aktivitas Harian

Setelah sesi kerja berjalan atau selesai, kamu bisa melihat daftar aktivitas yang sudah dianalisis:

- Nama aplikasi yang digunakan
- Judul jendela
- Kategori aktivitas
- Durasi

Data ini diperbarui secara otomatis di halaman Home.

---

## 9. Pengaturan Mode Tracker

Kamu bisa mengubah mode pelacakan aktivitas sesuai kebutuhan:

1. Buka menu **Settings** atau **Pengaturan**.
2. Temukan opsi **Tracker Mode**.
3. Pilih mode yang diinginkan (misalnya: Auto atau Manual).
4. Simpan perubahan.

---

## 10. Logout

1. Buka menu profil atau pengaturan.
2. Klik **Logout**.
3. Kamu akan diarahkan kembali ke halaman login.

---

## Pertanyaan Umum

**Screenshot diambil seberapa sering?**
Interval pengambilan screenshot dikonfigurasi oleh admin/supervisor. Kamu tidak perlu mengatur ini secara manual.

**Apakah screenshot saya bisa dilihat supervisor?**
Ya. Screenshot yang diambil akan dikirim ke server dan bisa dilihat oleh supervisor dalam laporan aktivitas.

**Apa yang terjadi jika koneksi internet terputus saat upload?**
Aplikasi akan mencoba ulang upload hingga 3 kali. Jika tetap gagal, error akan dicatat dan sesi tetap berjalan.

**Apakah sesi kerja otomatis berhenti saat saya tutup aplikasi?**
Tidak secara langsung. Jika ada sesi aktif saat aplikasi dibuka ulang, aplikasi akan melanjutkan sesi tersebut secara otomatis.
